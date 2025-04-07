use flate2::read::GzDecoder;
use futures_util::StreamExt;
use indicatif::ProgressBar;
use regex::Regex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State, Window, command};
use tokio::fs::File as AsyncFile;
use tokio::io::{AsyncWriteExt, BufReader, BufWriter};
use tokio::sync::Mutex;

pub struct DownloadManager {
    active_downloads: Mutex<Vec<String>>,
    active_extractions: Mutex<Vec<String>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            active_downloads: Mutex::new(Vec::new()),
            active_extractions: Mutex::new(Vec::new()),
        }
    }
}

#[derive(Clone, Serialize)]
pub struct DownloadProgress {
    build_id: String,
    percentage: f64,
    downloaded_bytes: u64,
    total_bytes: u64,
    speed: f64,
    eta: String,
}

#[derive(Clone, Serialize)]
pub struct ExtractionProgress {
    build_id: String,
    percentage: f64,
    current_file: String,
    total_files: usize,
    processed_files: usize,
    eta: String,
}

#[derive(Deserialize)]
pub struct DownloadRequest {
    build_id: String,
    url: String,
    destination: String,
    extract: bool,
    delete_after_extract: bool,
    use_manifest: Option<bool>,
    version: Option<String>,
}

#[derive(Serialize)]
pub struct DownloadResult {
    success: bool,
    message: String,
    path: Option<String>,
    extracted_path: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct ChunkedFile {
    #[serde(rename = "ChunksIds")]
    chunks_ids: Vec<i32>,
    #[serde(rename = "File")]
    file: String,
    #[serde(rename = "FileSize")]
    file_size: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ManifestFile {
    #[serde(rename = "Name")]
    pub name: String,
    #[serde(rename = "Chunks")]
    pub chunks: Vec<ChunkedFile>,
    #[serde(rename = "Size")]
    pub size: i64,
}

const BASE_URL: &str = "https://manifest.simplyblk.xyz"; // change to ur url

fn format_time(seconds: f64) -> String {
    if seconds.is_infinite() || seconds.is_nan() || seconds <= 0.0 {
        return "Calculating...".to_string();
    }

    let hours = (seconds / 3600.0).floor();
    let minutes = ((seconds % 3600.0) / 60.0).floor();
    let secs = seconds % 60.0;

    if hours > 0.0 {
        format!("{:.0}h {:.0}m {:.0}s", hours, minutes, secs)
    } else if minutes > 0.0 {
        format!("{:.0}m {:.0}s", minutes, secs)
    } else {
        format!("{:.0}s", secs)
    }
}

#[command]
pub async fn is_download_active(
    build_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<bool, String> {
    let active_downloads = download_manager.active_downloads.lock().await;
    Ok(active_downloads.contains(&build_id))
}

#[command]
pub async fn is_extraction_active(
    build_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<bool, String> {
    let active_extractions = download_manager.active_extractions.lock().await;
    Ok(active_extractions.contains(&build_id))
}

#[command]
pub async fn cancel_download(
    build_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<bool, String> {
    let mut active_downloads = download_manager.active_downloads.lock().await;
    if let Some(index) = active_downloads.iter().position(|id| id == &build_id) {
        active_downloads.remove(index);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[command]
pub async fn cancel_extraction(
    build_id: String,
    download_manager: State<'_, DownloadManager>,
) -> Result<bool, String> {
    let mut active_extractions = download_manager.active_extractions.lock().await;
    if let Some(index) = active_extractions.iter().position(|id| id == &build_id) {
        active_extractions.remove(index);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[command]
pub async fn get_available_versions() -> Result<Vec<String>, String> {
    let client = Client::new();
    let versions_url = format!("{}/versions.json", BASE_URL);

    match client.get(&versions_url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<String>>().await {
                    Ok(versions) => Ok(versions),
                    Err(e) => Err(format!("Failed to parse versions: {}", e)),
                }
            } else {
                Err(format!(
                    "Failed to fetch versions: HTTP {}",
                    response.status()
                ))
            }
        }
        Err(e) => Err(format!("Failed to fetch versions: {}", e)),
    }
}

#[command]
pub async fn get_manifest_for_version(version: String) -> Result<ManifestFile, String> {
    let re = Regex::new(r"Release-(\d+\.\d+)").unwrap();

    if let Some(caps) = re.captures(&version) {
        let extracted_version = caps.get(1).unwrap().as_str();

        let client = reqwest::Client::new();
        let manifest_url = format!(
            "{}/{}/{}.manifest",
            BASE_URL, extracted_version, extracted_version
        );

        match client.get(&manifest_url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    match response.json::<ManifestFile>().await {
                        Ok(manifest) => Ok(manifest),
                        Err(e) => Err(format!("Failed to parse manifest: {}", e)),
                    }
                } else {
                    Err(format!(
                        "Failed to fetch manifest: HTTP {}",
                        response.status()
                    ))
                }
            }
            Err(e) => Err(format!("Failed to fetch manifest: {}", e)),
        }
    } else {
        Err("Version format is incorrect".to_string())
    }
}

#[command]
pub async fn download_build(
    window: Window,
    request: DownloadRequest,
    download_manager: State<'_, DownloadManager>,
) -> Result<DownloadResult, String> {
    let build_id = request.build_id.clone();

    {
        let mut active_downloads = download_manager.active_downloads.lock().await;
        if active_downloads.contains(&build_id) {
            return Err("Download already in progress".into());
        }
        active_downloads.push(build_id.clone());
    }

    let dest_path = Path::new(&request.destination);
    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    let use_manifest = request.use_manifest.unwrap_or(false);

    let download_result = if use_manifest {
        if let Some(version) = request.version {
            download_manifest(
                window.clone(),
                build_id.clone(),
                &version,
                &request.destination,
                &download_manager,
            )
            .await
        } else {
            Err("Version is required for manifest-based download".into())
        }
    } else {
        download_file(
            window.clone(),
            build_id.clone(),
            &request.url,
            &request.destination,
            &download_manager,
        )
        .await
    };

    {
        let mut active_downloads = download_manager.active_downloads.lock().await;
        if let Some(index) = active_downloads.iter().position(|id| id == &build_id) {
            active_downloads.remove(index);
        }
    }

    match download_result {
        Ok(_) => {
            let file_metadata = match fs::metadata(&request.destination) {
                Ok(metadata) => metadata,
                Err(e) => {
                    return Err(format!("Failed to verify downloaded file: {}", e));
                }
            };

            if file_metadata.len() == 0 && !use_manifest {
                let _ = fs::remove_file(&request.destination);
                return Err("Downloaded file is empty. The URL may be invalid.".into());
            }

            Ok(DownloadResult {
                success: true,
                message: "Download completed successfully".into(),
                path: Some(request.destination),
                extracted_path: None,
            })
        }
        Err(e) => {
            let _ = std::fs::remove_file(&request.destination);

            let _ = window.emit("download:failed", build_id);

            Err(e.to_string())
        }
    }
}
async fn download_manifest(
    window: Window,
    build_id: String,
    version: &str,
    install_path: &str,
    download_manager: &State<'_, DownloadManager>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let manifest = get_manifest_for_version(version.to_string()).await?;
    let total_size = manifest.size;
    let mut completed_size: i64 = 0;
    let start_time = std::time::Instant::now();
    let mut last_update = std::time::Instant::now();

    let client = Client::builder()
        .pool_max_idle_per_host(20)
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()?;

    for chunked_file in manifest.chunks {
        let file_path = Path::new(install_path).join(&chunked_file.file);

        if let Some(parent) = file_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let mut output_file: AsyncFile = AsyncFile::create(&file_path).await?;
        let re = Regex::new(r"Release-(\d+\.\d+)").unwrap();

        for chunk_id in &chunked_file.chunks_ids {
            {
                let active_downloads = download_manager.active_downloads.lock().await;
                if !active_downloads.contains(&build_id) {
                    return Err("Download cancelled".into());
                }
            }

            let extracted_version = match re.captures(&version) {
                Some(caps) => caps.get(1).unwrap().as_str(),
                None => return Err("Version extraction failed".into()),
            };

            let chunk_url = format!("{}/{}/{}.chunk", BASE_URL, extracted_version, chunk_id);

            let response = client.get(&chunk_url).send().await?;

            if !response.status().is_success() {
                return Err(format!(
                    "Failed to download chunk {}: HTTP {}",
                    chunk_id,
                    response.status()
                )
                .into());
            }

            let chunk_data = response.bytes().await?;

            let mut decoder = GzDecoder::new(&chunk_data[..]);
            let mut decompressed_data = Vec::new();
            decoder.read_to_end(&mut decompressed_data)?;

            output_file.write_all(&decompressed_data).await?;

            completed_size += decompressed_data.len() as i64;
            let percentage = (completed_size as f64 / total_size as f64) * 100.0;

            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                completed_size as f64 / elapsed
            } else {
                0.0
            };
            let remaining_bytes = total_size - completed_size;
            let eta_seconds = if speed > 0.0 {
                remaining_bytes as f64 / speed
            } else {
                f64::INFINITY
            };
            let eta = format_time(eta_seconds);

            if last_update.elapsed().as_millis() > 100 {
                let _ = window.emit(
                    "download:progress",
                    DownloadProgress {
                        build_id: build_id.clone(),
                        percentage,
                        downloaded_bytes: completed_size as u64,
                        total_bytes: total_size as u64,
                        speed,
                        eta,
                    },
                );

                last_update = std::time::Instant::now();
            }
        }

        output_file.flush().await?;
    }

    let _ = window.emit(
        "download:progress",
        DownloadProgress {
            build_id: build_id.clone(),
            percentage: 100.0,
            downloaded_bytes: total_size as u64,
            total_bytes: total_size as u64,
            speed: 0.0,
            eta: "0s".to_string(),
        },
    );

    let _ = window.emit("download:completed", build_id);

    Ok(())
}

async fn download_file(
    window: Window,
    build_id: String,
    url: &str,
    destination: &str,
    download_manager: &State<'_, DownloadManager>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::builder()
        .pool_max_idle_per_host(20)
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(60))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()?;

    let res = client.get(url).send().await?;

    if !res.status().is_success() {
        return Err(format!("Failed to download file: HTTP {}", res.status()).into());
    }

    let total_size = res.content_length().unwrap_or(0);
    let has_content_length = total_size > 0;

    let mut file = tokio::fs::File::create(destination).await?;

    let mut stream = res.bytes_stream();

    let mut downloaded_bytes = 0u64;
    let start_time = std::time::Instant::now();
    let mut last_update = std::time::Instant::now();

    while let Some(chunk_result) = stream.next().await {
        {
            let active_downloads = download_manager.active_downloads.lock().await;
            if !active_downloads.contains(&build_id) {
                return Err("Download cancelled".into());
            }
        }

        let chunk = chunk_result?;

        file.write_all(&chunk).await?;

        downloaded_bytes += chunk.len() as u64;

        if last_update.elapsed().as_millis() > 100 {
            let elapsed = start_time.elapsed().as_secs_f64();
            let speed = if elapsed > 0.0 {
                downloaded_bytes as f64 / elapsed
            } else {
                0.0
            };

            let (percentage, eta) = if has_content_length && total_size > 0 {
                let percentage = (downloaded_bytes as f64 / total_size as f64) * 100.0;
                let remaining_bytes = total_size.saturating_sub(downloaded_bytes);
                let eta_seconds = if speed > 0.0 {
                    remaining_bytes as f64 / speed
                } else {
                    f64::INFINITY
                };
                (percentage, format_time(eta_seconds))
            } else {
                (0.0, "Unknown".to_string())
            };

            let _ = window.emit(
                "download:progress",
                DownloadProgress {
                    build_id: build_id.clone(),
                    percentage,
                    downloaded_bytes,
                    total_bytes: total_size,
                    speed,
                    eta,
                },
            );

            last_update = std::time::Instant::now();
        }
    }

    file.flush().await?;

    let file_size = tokio::fs::metadata(destination).await?.len();
    if file_size == 0 {
        return Err("Downloaded file is empty. The download may have failed.".into());
    }

    if has_content_length && file_size != total_size {
        return Err(format!(
            "Downloaded file size ({}) doesn't match expected size ({}). The download may be incomplete.",
            file_size, total_size
        ).into());
    }

    let _ = window.emit("download:completed", build_id);

    Ok(())
}

#[command]
pub fn get_default_install_dir() -> Result<String, String> {
    let home_dir =
        dirs::home_dir().ok_or_else(|| "Could not determine home directory".to_string())?;
    let default_dir = home_dir.join("Solaris").join("Builds");

    if !default_dir.exists() {
        std::fs::create_dir_all(&default_dir).map_err(|e| e.to_string())?;
    }

    Ok(default_dir.to_string_lossy().to_string())
}
