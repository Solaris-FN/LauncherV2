use flate2::read::GzDecoder;
use futures_util::StreamExt;
use indicatif::ProgressBar;
use regex::Regex;
use reqwest::Client;
use serde::{ Deserialize, Serialize };
use std::fs::{ self, File };
use std::io::{ self, Read, Seek, SeekFrom, Write };
use std::path::{ Path, PathBuf };
use std::sync::Arc;
use std::time::{ Duration, Instant };
use tauri::{ AppHandle, Emitter, State, Window, command };
use tokio::fs::File as AsyncFile;
use tokio::io::{ AsyncWriteExt, BufReader, BufWriter };
use tokio::sync::Mutex;
use tokio::time::timeout;

const MAX_RETRIES: usize = 3;
const RETRY_DELAY_MS: u64 = 1000;
const UPDATE_INTERVAL_MS: u64 = 100;
const REQUEST_TIMEOUT_SECS: u64 = 60;
const BASE_URL: &str = "https://manifest.simplyblk.xyz";

pub struct DownloadManager {
    active_downloads: Mutex<Vec<String>>,
    active_extractions: Mutex<Vec<String>>,
    download_speeds: Mutex<std::collections::HashMap<String, Vec<(Instant, u64)>>>,
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            active_downloads: Mutex::new(Vec::new()),
            active_extractions: Mutex::new(Vec::new()),
            download_speeds: Mutex::new(std::collections::HashMap::new()),
        }
    }

    async fn update_speed_data(&self, build_id: &str, bytes: u64) -> f64 {
        let mut speeds = self.download_speeds.lock().await;
        let speed_data = speeds.entry(build_id.to_string()).or_insert_with(Vec::new);

        let now = Instant::now();
        speed_data.push((now, bytes));

        let cutoff = now - Duration::from_secs(5);
        speed_data.retain(|(time, _)| *time >= cutoff);

        if speed_data.len() >= 2 {
            let first = &speed_data[0];
            let last = &speed_data[speed_data.len() - 1];

            let elapsed = last.0.duration_since(first.0).as_secs_f64();
            let bytes_diff = last.1 - first.1;

            if elapsed > 0.0 {
                (bytes_diff as f64) / elapsed
            } else {
                0.0
            }
        } else {
            0.0
        }
    }

    async fn clear_speed_data(&self, build_id: &str) {
        let mut speeds = self.download_speeds.lock().await;
        speeds.remove(build_id);
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
    download_manager: State<'_, DownloadManager>
) -> Result<bool, String> {
    let active_downloads = download_manager.active_downloads.lock().await;
    Ok(active_downloads.contains(&build_id))
}

#[command]
pub async fn is_extraction_active(
    build_id: String,
    download_manager: State<'_, DownloadManager>
) -> Result<bool, String> {
    let active_extractions = download_manager.active_extractions.lock().await;
    Ok(active_extractions.contains(&build_id))
}

#[command]
pub async fn cancel_download(
    build_id: String,
    download_manager: State<'_, DownloadManager>
) -> Result<bool, String> {
    let mut active_downloads = download_manager.active_downloads.lock().await;
    if let Some(index) = active_downloads.iter().position(|id| id == &build_id) {
        active_downloads.remove(index);
        download_manager.clear_speed_data(&build_id).await;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[command]
pub async fn cancel_extraction(
    build_id: String,
    download_manager: State<'_, DownloadManager>
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
    let versions_url = format!("{}/versions.json", "https://cdn.solarisfn.org");

    let response = client
        .get(&versions_url)
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .send().await
        .map_err(|e| format!("Network error fetching versions: {}", e))?;

    if response.status().is_success() {
        response.json::<Vec<String>>().await.map_err(|e| format!("Failed to parse versions: {}", e))
    } else {
        Err(format!("Failed to fetch versions: HTTP {}", response.status()))
    }
}

#[command]
pub async fn get_manifest_for_version(version: String) -> Result<ManifestFile, String> {
    let re = Regex::new(r"Release-(\d+\.\d+)").map_err(|e| format!("Regex error: {}", e))?;

    if let Some(caps) = re.captures(&version) {
        let extracted_version = caps.get(1).unwrap().as_str();

        let client = Client::new();
        let manifest_url = format!(
            "{}/{}/{}.manifest",
            BASE_URL,
            extracted_version,
            extracted_version
        );

        let mut retries = 0;
        let mut last_error = String::new();

        while retries < MAX_RETRIES {
            match
                client
                    .get(&manifest_url)
                    .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
                    .send().await
            {
                Ok(response) => {
                    if response.status().is_success() {
                        return response
                            .json::<ManifestFile>().await
                            .map_err(|e| format!("Failed to parse manifest: {}", e));
                    } else if response.status().is_server_error() {
                        last_error = format!("Server error: HTTP {}", response.status());
                        retries += 1;
                        tokio::time::sleep(
                            Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                        ).await;
                        continue;
                    } else {
                        return Err(format!("Failed to fetch manifest: HTTP {}", response.status()));
                    }
                }
                Err(e) => {
                    last_error = format!("Network error: {}", e);
                    retries += 1;
                    tokio::time::sleep(
                        Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                    ).await;
                }
            }
        }

        Err(
            format!(
                "Failed to fetch manifest after {} retries. Last error: {}",
                MAX_RETRIES,
                last_error
            )
        )
    } else {
        Err("Version format is incorrect".to_string())
    }
}

#[command]
pub async fn download_build(
    window: Window,
    request: DownloadRequest,
    download_manager: State<'_, DownloadManager>
) -> Result<DownloadResult, String> {
    let build_id = request.build_id.clone();

    {
        let active_downloads = download_manager.active_downloads.lock().await;
        if active_downloads.contains(&build_id) {
            return Err("Download already in progress".into());
        }
    }

    {
        let mut active_downloads = download_manager.active_downloads.lock().await;
        active_downloads.push(build_id.clone());
    }

    let dest_path = Path::new(&request.destination);
    if let Some(parent) = dest_path.parent() {
        if !parent.exists() {
            std::fs
                ::create_dir_all(parent)
                .map_err(|e| format!("Failed to create destination directory: {}", e))?;
        }
    }

    let temp_dest = format!("{}.download", request.destination);

    let use_manifest = request.use_manifest.unwrap_or(false);

    let download_result = if use_manifest {
        if let Some(version) = request.version.clone() {
            download_manifest(
                window.clone(),
                build_id.clone(),
                &version,
                &temp_dest,
                &download_manager
            ).await
        } else {
            Err("Version is required for manifest-based download".into())
        }
    } else {
        download_file(
            window.clone(),
            build_id.clone(),
            &request.url,
            &temp_dest,
            &download_manager
        ).await
    };

    {
        let mut active_downloads = download_manager.active_downloads.lock().await;
        if let Some(index) = active_downloads.iter().position(|id| id == &build_id) {
            active_downloads.remove(index);
        }
        download_manager.clear_speed_data(&build_id).await;
    }

    match download_result {
        Ok(_) => {
            let file_metadata = fs
                ::metadata(&temp_dest)
                .map_err(|e| format!("Failed to verify downloaded file: {}", e))?;

            if file_metadata.len() == 0 && !use_manifest {
                let _ = fs::remove_file(&temp_dest);
                return Err("Downloaded file is empty. The URL may be invalid.".into());
            }

            if Path::new(&request.destination).exists() {
                let _ = fs::remove_file(&request.destination);
            }

            fs
                ::rename(&temp_dest, &request.destination)
                .map_err(|e| format!("Failed to finalize download: {}", e))?;

            Ok(DownloadResult {
                success: true,
                message: "Download completed successfully".into(),
                path: Some(request.destination),
                extracted_path: None,
            })
        }
        Err(e) => {
            let _ = std::fs::remove_file(&temp_dest);
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
    download_manager: &State<'_, DownloadManager>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let manifest = match get_manifest_for_version(version.to_string()).await {
        Ok(manifest) => manifest,
        Err(e) => {
            return Err(format!("Failed to get manifest: {}", e).into());
        }
    };

    let total_size = manifest.size;
    let mut completed_size: i64 = 0;
    let start_time = std::time::Instant::now();
    let mut last_update = std::time::Instant::now();

    let client = Client::builder()
        .pool_max_idle_per_host(20)
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()?;

    let re = Regex::new(r"Release-(\d+\.\d+)")?;
    let extracted_version = match re.captures(version) {
        Some(caps) => caps.get(1).unwrap().as_str().to_string(),
        None => {
            return Err("Version extraction failed".into());
        }
    };

    let base_path = Path::new(install_path);
    if let Some(parent) = base_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    for chunked_file in manifest.chunks {
        let file_path = base_path.join(&chunked_file.file);
        if let Some(parent) = file_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let temp_file_path = format!("{}.part", file_path.to_string_lossy());

        let mut output_file = AsyncFile::create(&temp_file_path).await?;

        for chunk_id in &chunked_file.chunks_ids {
            {
                let active_downloads = download_manager.active_downloads.lock().await;
                if !active_downloads.contains(&build_id) {
                    let _ = tokio::fs::remove_file(&temp_file_path).await;
                    return Err("Download cancelled".into());
                }
            }

            let chunk_url = format!("{}/{}/{}.chunk", BASE_URL, extracted_version, chunk_id);

            let mut retries = 0;
            let mut chunk_data = None;

            while retries < MAX_RETRIES && chunk_data.is_none() {
                match client.get(&chunk_url).send().await {
                    Ok(response) => {
                        if response.status().is_success() {
                            match response.bytes().await {
                                Ok(data) => {
                                    chunk_data = Some(data);
                                }
                                Err(e) => {
                                    retries += 1;
                                    if retries >= MAX_RETRIES {
                                        let _ = tokio::fs::remove_file(&temp_file_path).await;
                                        return Err(
                                            format!("Failed to download chunk data: {}", e).into()
                                        );
                                    }
                                    tokio::time::sleep(
                                        Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                                    ).await;
                                }
                            }
                        } else if response.status().is_server_error() {
                            retries += 1;
                            if retries >= MAX_RETRIES {
                                let _ = tokio::fs::remove_file(&temp_file_path).await;
                                return Err(
                                    format!(
                                        "Failed to download chunk {}: HTTP {}",
                                        chunk_id,
                                        response.status()
                                    ).into()
                                );
                            }
                            tokio::time::sleep(
                                Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                            ).await;
                        } else {
                            // Client error, don't retry
                            // Clean up temp file
                            let _ = tokio::fs::remove_file(&temp_file_path).await;
                            return Err(
                                format!(
                                    "Failed to download chunk {}: HTTP {}",
                                    chunk_id,
                                    response.status()
                                ).into()
                            );
                        }
                    }
                    Err(e) => {
                        retries += 1;
                        if retries >= MAX_RETRIES {
                            let _ = tokio::fs::remove_file(&temp_file_path).await;
                            return Err(
                                format!(
                                    "Network error downloading chunk {}: {}",
                                    chunk_id,
                                    e
                                ).into()
                            );
                        }
                        tokio::time::sleep(
                            Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                        ).await;
                    }
                }
            }

            let chunk_data = chunk_data.ok_or("Failed to download chunk")?;

            let mut decoder = GzDecoder::new(&chunk_data[..]);
            let mut decompressed_data = Vec::new();
            decoder.read_to_end(&mut decompressed_data)?;

            output_file.write_all(&decompressed_data).await?;

            completed_size += decompressed_data.len() as i64;
            let percentage = ((completed_size as f64) / (total_size as f64)) * 100.0;

            let speed = download_manager.update_speed_data(&build_id, completed_size as u64).await;
            let remaining_bytes = total_size - completed_size;
            let eta_seconds = if speed > 0.0 {
                (remaining_bytes as f64) / speed
            } else {
                f64::INFINITY
            };
            let eta = format_time(eta_seconds);

            if last_update.elapsed().as_millis() > (UPDATE_INTERVAL_MS as u128) {
                let _ = window.emit("download:progress", DownloadProgress {
                    build_id: build_id.clone(),
                    percentage,
                    downloaded_bytes: completed_size as u64,
                    total_bytes: total_size as u64,
                    speed,
                    eta,
                });

                last_update = std::time::Instant::now();
            }
        }

        output_file.flush().await?;
        drop(output_file);

        if file_path.exists() {
            tokio::fs::remove_file(&file_path).await?;
        }

        tokio::fs::rename(&temp_file_path, &file_path).await?;
    }

    let _ = window.emit("download:progress", DownloadProgress {
        build_id: build_id.clone(),
        percentage: 100.0,
        downloaded_bytes: total_size as u64,
        total_bytes: total_size as u64,
        speed: 0.0,
        eta: "0s".to_string(),
    });

    let _ = window.emit("download:completed", build_id);

    Ok(())
}

async fn download_file(
    window: Window,
    build_id: String,
    url: &str,
    destination: &str,
    download_manager: &State<'_, DownloadManager>
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let client = Client::builder()
        .pool_max_idle_per_host(20)
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .timeout(std::time::Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .connect_timeout(std::time::Duration::from_secs(10))
        .build()?;

    let mut response = None;
    let mut retries = 0;
    let mut last_error = String::new();

    while retries < MAX_RETRIES && response.is_none() {
        match client.get(url).send().await {
            Ok(res) => {
                if res.status().is_success() {
                    response = Some(res);
                } else if res.status().is_server_error() {
                    last_error = format!("Server error: HTTP {}", res.status());
                    retries += 1;
                    tokio::time::sleep(
                        Duration::from_millis(RETRY_DELAY_MS * (retries as u64))
                    ).await;
                } else {
                    return Err(format!("Failed to download file: HTTP {}", res.status()).into());
                }
            }
            Err(e) => {
                last_error = format!("Network error: {}", e);
                retries += 1;
                if retries >= MAX_RETRIES {
                    return Err(
                        format!(
                            "Failed to download after {} attempts. Last error: {}",
                            MAX_RETRIES,
                            last_error
                        ).into()
                    );
                }
                tokio::time::sleep(Duration::from_millis(RETRY_DELAY_MS * (retries as u64))).await;
            }
        }
    }

    let res = response.ok_or(format!("Failed to download after {} attempts", MAX_RETRIES))?;

    let total_size = res.content_length().unwrap_or(0);
    let has_content_length = total_size > 0;

    let mut file = tokio::fs::File::create(destination).await?;

    let mut stream = res.bytes_stream();
    let mut downloaded_bytes = 0u64;
    let start_time = std::time::Instant::now();
    let mut last_update = std::time::Instant::now();
    let mut last_download_time = std::time::Instant::now();
    let timeout_duration = Duration::from_secs(30); // Timeout if no data received for 30 seconds

    while let Some(chunk_result) = stream.next().await {
        {
            let active_downloads = download_manager.active_downloads.lock().await;
            if !active_downloads.contains(&build_id) {
                file.flush().await?;
                drop(file);
                let _ = tokio::fs::remove_file(destination).await;
                return Err("Download cancelled".into());
            }
        }

        if last_download_time.elapsed() > timeout_duration {
            file.flush().await?;
            drop(file);
            let _ = tokio::fs::remove_file(destination).await;
            return Err("Download timed out - no data received for 30 seconds".into());
        }

        match chunk_result {
            Ok(chunk) => {
                file.write_all(&chunk).await?;
                downloaded_bytes += chunk.len() as u64;
                last_download_time = std::time::Instant::now();

                if last_update.elapsed().as_millis() > (UPDATE_INTERVAL_MS as u128) {
                    let speed = download_manager.update_speed_data(
                        &build_id,
                        downloaded_bytes
                    ).await;

                    let (percentage, eta) = if has_content_length && total_size > 0 {
                        let percentage: f64 =
                            ((downloaded_bytes as f64) / (total_size as f64)) * 100.0;
                        let remaining_bytes = total_size.saturating_sub(downloaded_bytes);
                        let eta_seconds = if speed > 0.0 {
                            (remaining_bytes as f64) / speed
                        } else {
                            f64::INFINITY
                        };
                        (percentage, format_time(eta_seconds))
                    } else {
                        (0.0, "Unknown".to_string())
                    };

                    let _ = window.emit("download:progress", DownloadProgress {
                        build_id: build_id.clone(),
                        percentage,
                        downloaded_bytes,
                        total_bytes: total_size,
                        speed,
                        eta,
                    });

                    last_update = std::time::Instant::now();
                }
            }
            Err(e) => {
                file.flush().await?;
                drop(file);

                let _ = tokio::fs::remove_file(destination).await;

                return Err(format!("Error downloading file: {}", e).into());
            }
        }
    }

    file.flush().await?;
    drop(file);

    let file_size = tokio::fs::metadata(destination).await?.len();
    if file_size == 0 {
        let _ = tokio::fs::remove_file(destination).await;
        return Err("Downloaded file is empty. The download may have failed.".into());
    }

    if has_content_length && file_size != total_size {
        let _ = tokio::fs::remove_file(destination).await;
        return Err(
            format!(
                "Downloaded file size ({}) doesn't match expected size ({}). The download may be incomplete.",
                file_size,
                total_size
            ).into()
        );
    }

    let _ = window.emit("download:completed", build_id);

    Ok(())
}

#[command]
pub fn get_default_install_dir() -> Result<String, String> {
    let home_dir = dirs
        ::home_dir()
        .ok_or_else(|| "Could not determine home directory".to_string())?;
    let default_dir = home_dir.join("Solaris").join("Builds");

    if !default_dir.exists() {
        std::fs::create_dir_all(&default_dir).map_err(|e| e.to_string())?;
    }

    Ok(default_dir.to_string_lossy().to_string())
}
