use declarative_discord_rich_presence::DeclarativeDiscordIpcClient;
use declarative_discord_rich_presence::activity::{ Activity, Assets, Button, Timestamps };
use futures_util::StreamExt;
use regex::Regex;
use reqwest::StatusCode;
use std::ffi::CString;
use std::fs::{ self, File, OpenOptions };
use std::io::Read;
use std::io::Write;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::path::PathBuf;
use std::process::Stdio;
use std::time::{ Duration, Instant };
use sysinfo::{ System, SystemExt };
use tauri::AppHandle;
use tauri::Emitter;
use tauri::Manager;
use tauri::WindowEvent;
use winapi::um::winbase::CREATE_SUSPENDED;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Shell::ShellExecuteA;
use windows::core::PCSTR;
use windows::Win32::UI::WindowsAndMessaging::{ SW_SHOW, SW_HIDE };

mod builds;
use builds::download_manager::{
    DownloadManager,
    cancel_download,
    cancel_extraction,
    download_build,
    get_available_versions,
    get_default_install_dir,
    get_manifest_for_version,
    is_download_active,
    is_extraction_active,
};

const CREATE_NO_WINDOW: u32 = 0x08000000;
const MAX_RETRIES: usize = 300;
const TIMEOUT_SECONDS: u64 = 300;
const MIN_PROGRESS_INTERVAL_MS: u64 = 500;

#[tauri::command]
fn get_fortnite_processid() -> Result<Option<String>, String> {
    let output = std::process::Command
        ::new("wmic")
        .creation_flags(CREATE_NO_WINDOW)
        .args(
            &[
                "process",
                "where",
                "name='FortniteClient-Win64-Shipping.exe'",
                "get",
                "ExecutablePath",
            ]
        )
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    for line in output_str.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() && !trimmed.starts_with("ExecutablePath") {
            return Ok(Some(trimmed.to_string()));
        }
    }

    Ok(None)
}

#[tauri::command]
fn exit_all() -> Result<(), String> {
    use std::env;
    use std::fs::File;
    use std::io::Write;

    let hwnd: HWND = HWND(std::ptr::null_mut());

    let processes = vec![
        "EpicGamesLauncher.exe",
        "FortniteLauncher.exe",
        "FortniteClient-Win64-Shipping_EAC.exe",
        "FortniteClient-Win64-Shipping.exe",
        "FortniteClient-Win64-Shipping_BE.exe",
        "EasyAntiCheat_EOS.exe",
        "EpicWebHelper.exe",
        "EACStrapper.exe"
    ];

    let temp_dir = env::temp_dir();
    let batch_path = temp_dir.join("close.bat");

    let mut batch_file = File::create(&batch_path).map_err(|e|
        format!("Failed to create batch file: {}", e)
    )?;

    writeln!(batch_file, "@echo off").map_err(|e| format!("Write error: {}", e))?;
    for process in processes {
        writeln!(batch_file, "taskkill /F /IM \"{}\" >nul 2>&1", process).map_err(|e|
            format!("Write error: {}", e)
        )?;
    }
    writeln!(batch_file, "del \"%~f0\"").map_err(|e| format!("Write error: {}", e))?;

    drop(batch_file);

    let batch_path_str = batch_path.to_str().ok_or("Invalid path")?;
    let batch_cstring = CString::new(batch_path_str).map_err(|e| format!("CString error: {}", e))?;

    let result = unsafe {
        ShellExecuteA(
            hwnd,
            PCSTR::from_raw("runas\0".as_ptr() as *const u8),
            PCSTR(batch_cstring.as_ptr() as *const u8),
            PCSTR::null(),
            PCSTR::null(),
            SW_HIDE
        )
    };

    if result.is_invalid() {
        return Err("Failed to close game with batch file".to_string());
    }

    Ok(())
}

#[tauri::command]
async fn check_file_exists_and_size(path: &str, size: Option<u64>) -> Result<bool, String> {
    let file_path = std::path::PathBuf::from(path);
    if !file_path.exists() {
        return Ok(false);
    }

    match size {
        Some(expected_size) => {
            let actual_size = match file_path.metadata() {
                Ok(metadata) => metadata.len(),
                Err(err) => {
                    return Err(err.to_string());
                }
            };

            Ok(actual_size == expected_size)
        }
        None => Ok(true),
    }
}

#[tauri::command]
async fn check_file_exists(path: &str) -> Result<bool, String> {
    let file_path = std::path::PathBuf::from(path);

    if !file_path.exists() {
        return Ok(false);
    }

    Ok(true)
}

#[tauri::command]
fn search_for_version(path: &str) -> Result<Vec<String>, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    let pattern = [
        0x2b, 0x00, 0x2b, 0x00, 0x46, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x74, 0x00, 0x6e, 0x00, 0x69, 0x00,
        0x74, 0x00, 0x65, 0x00, 0x2b, 0x00,
    ];

    let mut matches = Vec::new();
    for (i, window) in buffer.windows(pattern.len()).enumerate() {
        if window == pattern {
            let _start = i.saturating_sub(32);
            let end = (i + pattern.len() + 64).min(buffer.len());

            let end_index = find_end(&buffer[i + pattern.len()..end]);
            if let Some(end) = end_index {
                let utf16_slice = unsafe {
                    std::slice::from_raw_parts(
                        buffer[i..i + pattern.len() + end].as_ptr() as *const u16,
                        (pattern.len() + end) / 2
                    )
                };
                let s = String::from_utf16_lossy(utf16_slice);
                matches.push(s.trim_end_matches('\0').to_string());
            }
        }
    }

    Ok(matches)
}

fn find_end(data: &[u8]) -> Option<usize> {
    let mut i = 0;
    while i + 1 < data.len() {
        if data[i] == 0 && data[i + 1] == 0 {
            return Some(i);
        }
        i += 2;
    }
    None
}

fn exit() {
    let mut system = System::new_all();
    system.refresh_all();
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let processes = vec![
        "EpicGamesLauncher.exe",
        "FortniteLauncher.exe",
        "FortniteClient-Win64-Shipping_EAC.exe",
        "FortniteClient-Win64-Shipping.exe",
        "FortniteClient-Win64-Shipping_BE.exe",
        "EasyAntiCheat_EOS.exe",
        "EpicWebHelper.exe",
        "EACStrapper.exe"
    ];

    for process in processes.iter() {
        let mut cmd = std::process::Command::new("taskkill");
        cmd.arg("/F");
        cmd.arg("/IM");
        cmd.arg(process);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().unwrap();
    }
}

fn download_file(url: &str, dest: &Path) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)?;
    }
    let response = reqwest::blocking::get(url)?;
    let mut file = fs::File::create(dest)?;
    let content = response.bytes()?;
    file.write_all(&content)?;
    Ok(())
}

#[tauri::command]
fn experience(
    folder_path: String,
    exchange_code: String,
    is_dev: bool,
    eor: bool,
    dpe: bool,
    ror: bool,
    version: String
) -> Result<bool, String> {
    exit();
    std::thread::sleep(std::time::Duration::from_secs(2));
    let game_path = PathBuf::from(folder_path);

    if !is_dev {
        let mut game_dll = game_path.clone();
        game_dll.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
        );

        if game_dll.exists() {
            loop {
                let mut game_dll2 = game_path.clone();
                game_dll2.push(
                    "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
                );

                if std::fs::remove_file(game_dll2).is_ok() {
                    break;
                }

                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }

        let mut game_dll = game_path.clone();
        game_dll.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
        );

        // let _ = std::fs::copy(
        //     r"C:\Users\andrew\RiderProjects\Solaris\Asteria\x64\Release\Asteria.dll",
        //     &game_dll
        // );

        let _ = download_file("https://cdn.solarisfn.org/Asteria.dll", &game_dll);

        let dlls = [
            "api-ms-win-core-errorhandling-l1-1-0.dll",
            "api-ms-win-core-file-l1-1-0.dll",
            "api-ms-win-core-file-l1-2-0.dll",
            "api-ms-win-core-file-l2-1-0.dll",
            "api-ms-win-core-handle-l1-1-0.dll",
            "api-ms-win-core-heap-l1-1-0.dll",
            "api-ms-win-core-interlocked-l1-1-0.dll",
            "api-ms-win-core-libraryloader-l1-1-0.dll",
            "api-ms-win-core-localization-l1-2-0.dll",
            "api-ms-win-core-memory-l1-1-0.dll",
            "api-ms-win-core-namedpipe-l1-1-0.dll",
            "api-ms-win-core-processenvironment-l1-1-0.dll",
            "api-ms-win-core-processthreads-l1-1-0.dll",
            "api-ms-win-core-processthreads-l1-1-1.dll",
            "api-ms-win-core-profile-l1-1-0.dll",
            "api-ms-win-core-rtlsupport-l1-1-0.dll",
            "api-ms-win-core-string-l1-1-0.dll",
            "api-ms-win-core-synch-l1-1-0.dll",
            "api-ms-win-core-synch-l1-2-0.dll",
            "api-ms-win-core-sysinfo-l1-1-0.dll",
            "api-ms-win-core-timezone-l1-1-0.dll",
            "api-ms-win-core-util-l1-1-0.dll",
            "api-ms-win-crt-conio-l1-1-0.dll",
            "api-ms-win-crt-convert-l1-1-0.dll",
            "api-ms-win-crt-environment-l1-1-0.dll",
            "api-ms-win-crt-filesystem-l1-1-0.dll",
            "api-ms-win-crt-heap-l1-1-0.dll",
            "api-ms-win-crt-locale-l1-1-0.dll",
            "api-ms-win-crt-math-l1-1-0.dll",
            "api-ms-win-crt-multibyte-l1-1-0.dll",
            "api-ms-win-crt-private-l1-1-0.dll",
            "api-ms-win-crt-process-l1-1-0.dll",
            "api-ms-win-crt-runtime-l1-1-0.dll",
            "api-ms-win-crt-stdio-l1-1-0.dll",
            "api-ms-win-crt-string-l1-1-0.dll",
            "api-ms-win-crt-time-l1-1-0.dll",
            "api-ms-win-crt-utility-l1-1-0.dll",
            "api-ms-win-core-console-l1-1-0.dll",
            "api-ms-win-core-console-l1-2-0.dll",
            "api-ms-win-core-datetime-l1-1-0.dll",
            "api-ms-win-core-debug-l1-1-0.dll",
            "msvcp140.dll",
            "msvcp140_1.dll",
            "vcruntime140.dll",
            "vcruntime140_1.dll",
        ];

        for dll in dlls {
            let mut dll_path = game_path.clone();
            dll_path.push("FortniteGame\\Binaries\\Win64");
            dll_path.push(dll);

            if dll_path.exists() {
                if let Err(e) = std::fs::remove_file(&dll_path) {
                    eprintln!("Failed to delete {}: {}", dll, e);
                }
            }
        }
    }

    let mut game_real = game_path.clone();
    game_real.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe");
    let mut fnlauncher = game_path.clone();
    fnlauncher.push("FortniteGame\\Binaries\\Win64\\FortniteLauncher.exe");

    let mut fnac = game_path.clone();
    fnac.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping_BE.exe");

    let exchange_arg = &format!("-AUTH_PASSWORD={}", exchange_code);

    let mut fort_args = vec![
        "-epicapp=Fortnite",
        "-epicenv=Prod",
        "-epiclocale=en-us",
        "-epicportal",
        "-nobe",
        "-fromfl=eac",
        "-fltoken=3db3ba5dcbd2e16703f3978d",
        "-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYmU5ZGE1YzJmYmVhNDQwN2IyZjQwZWJhYWQ4NTlhZDQiLCJnZW5lcmF0ZWQiOjE2Mzg3MTcyNzgsImNhbGRlcmFHdWlkIjoiMzgxMGI4NjMtMmE2NS00NDU3LTliNTgtNGRhYjNiNDgyYTg2IiwiYWNQcm92aWRlciI6IkVhc3lBbnRpQ2hlYXQiLCJub3RlcyI6IiIsImZhbGxiYWNrIjpmYWxzZX0.VAWQB67RTxhiWOxx7DBjnzDnXyyEnX7OljJm-j2d88G_WgwQ9wrE6lwMEHZHjBd1ISJdUO1UVUqkfLdU5nofBQs",
        "-skippatchcheck",
        "-AUTH_LOGIN=",
        exchange_arg,
        "-AUTH_TYPE=exchangecode"
    ];

    if eor {
        fort_args.push("-eor");
    }

    if ror {
        fort_args.push("-ror");
    }

    if dpe {
        fort_args.push("-nopreedits");
    }

    if version == "9.10" {
        let hwnd: HWND = HWND(std::ptr::null_mut());
        let args_cstring = CString::new(fort_args.join(" ")).map_err(|e|
            format!("CString error: {}", e)
        )?;

        let exe_str = game_real.to_str().ok_or("Invalid path")?;
        let exe_cstring = CString::new(exe_str).map_err(|e| format!("CString error: {}", e))?;

        let result = unsafe {
            ShellExecuteA(
                hwnd,
                PCSTR::from_raw("runas\0".as_ptr() as *const u8),
                PCSTR(exe_cstring.as_ptr() as *const u8),
                PCSTR(args_cstring.as_ptr() as *const u8),
                PCSTR::null(),
                SW_SHOW
            )
        };

        if result.is_invalid() {
            return Err("Failed to start Solaris".to_string());
        }
    } else {
        println!("Starting Solaris with args: {:?}", fort_args);
        let _x = std::process::Command
            ::new(game_real)
            .creation_flags(CREATE_NO_WINDOW)
            .args(&fort_args)
            .stdout(Stdio::piped())
            .spawn()
            .map_err(|e| {
                eprintln!("Error starting Solaris: {}", e);
                format!("Failed to start Solaris: {}", e)
            })?;
    }

    let _fnlauncherfr = std::process::Command
        ::new(fnlauncher)
        .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
        .args(&fort_args)
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Solaris: {}", e));

    let _ac = std::process::Command
        ::new(fnac)
        .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
        .args(&fort_args)
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Solaris: {}", e));

    Ok(true)
}

#[tauri::command]
fn rich_presence(username: String, character: String) {
    let client = DeclarativeDiscordIpcClient::new("1229597606133497938");

    client.enable();

    let buttons = vec![
        Button::new(String::from("Play Solaris!"), String::from("https://discord.gg/solarisfn"))
    ];

    let timestamp = Timestamps::new();

    let _ = client.set_activity(
        Activity::new()
            .buttons(buttons)
            .timestamps(timestamp)
            .details(&format!("Logged in as {}", username))
            .assets(Assets::new().large_image("embedded_cover"))
            .assets(Assets::new().small_image(&character))
    );
}

#[tauri::command]
async fn check_game_exists(path: &str) -> Result<bool, String> {
    let game_path = PathBuf::from(path);
    let mut game = game_path.clone();
    game.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe");

    if !game.exists() {
        return Err("Hmmm could not find all Fortnite files".to_string());
    } else {
        Ok(true)
    }
}

#[tauri::command]
async fn download_game_file(url: &str, dest: &str, app: AppHandle) -> Result<(), String> {
    let dest_path = Path::new(dest);

    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    let filename = dest_path
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("unknown");

    let mut downloaded: u64 = 0;
    let mut retry_count: usize = 0;
    let mut file_size: u64 = 0;

    if dest_path.exists() {
        match fs::remove_file(dest_path) {
            Ok(_) => {
                downloaded = 0;

                let _ = app.emit(
                    "download-progress",
                    serde_json::json!({
                        "filename": filename,
                        "downloaded": downloaded,
                        "total": 0,
                        "progress": 0,
                        "speed": 0.0,
                        "message": "Old file deleted, starting fresh download..."
                    })
                );
            }
            Err(e) => {
                return Err(format!("Failed to delete old file: {}", e));
            }
        }
    }

    let mut last_update_time = Instant::now();
    let mut bytes_since_last_update: u64 = 0;
    let mut last_progress_percentage: u64 = 0;

    let client = reqwest::Client
        ::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECONDS))
        .connect_timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    while retry_count < MAX_RETRIES {
        if retry_count > 0 {
            let _ = app.emit(
                "download-progress",
                serde_json::json!({
                    "filename": filename,
                    "downloaded": downloaded,
                    "total": file_size,
                    "progress": if file_size > 0 { (downloaded * 100) / file_size } else { 0 },
                    "speed": 0.0,
                    "message": format!("Retry attempt {} of {}", retry_count, MAX_RETRIES)
                })
            );
        }

        let mut file = if downloaded > 0 {
            match OpenOptions::new().write(true).append(true).open(dest_path) {
                Ok(f) => f,
                Err(_e) => {
                    downloaded = 0;
                    File::create(dest_path).map_err(|e| format!("Failed to create file: {}", e))?
                }
            }
        } else {
            File::create(dest_path).map_err(|e| format!("Failed to create file: {}", e))?
        };

        let mut request = client.get(url);
        if downloaded > 0 {
            request = request.header("Range", format!("bytes={}-", downloaded));
        }

        match request.send().await {
            Ok(response) => {
                let status = response.status();

                if !(status.is_success() || status == StatusCode::PARTIAL_CONTENT) {
                    retry_count += 1;
                    continue;
                }

                if file_size == 0 {
                    file_size = if status == StatusCode::PARTIAL_CONTENT {
                        if let Some(content_range) = response.headers().get("content-range") {
                            if let Ok(range_str) = content_range.to_str() {
                                if let Some(size_str) = range_str.split('/').nth(1) {
                                    size_str.parse::<u64>().unwrap_or(0)
                                } else {
                                    0
                                }
                            } else {
                                0
                            }
                        } else {
                            response.content_length().unwrap_or(0) + downloaded
                        }
                    } else {
                        response.content_length().unwrap_or(0)
                    };
                }

                let mut stream = response.bytes_stream();
                let mut chunk_timeout = false;

                while let Some(chunk_result) = stream.next().await {
                    match chunk_result {
                        Ok(chunk) => {
                            chunk_timeout = false;

                            match file.write_all(&chunk) {
                                Ok(_) => {
                                    downloaded += chunk.len() as u64;
                                    bytes_since_last_update += chunk.len() as u64;

                                    let progress = if file_size > 0 {
                                        (downloaded * 100) / file_size
                                    } else {
                                        0
                                    };

                                    let time_since_update = last_update_time.elapsed();
                                    if
                                        progress > last_progress_percentage ||
                                        time_since_update.as_millis() >
                                            (MIN_PROGRESS_INTERVAL_MS as u128)
                                    {
                                        let speed_mbps = if time_since_update.as_secs_f64() > 0.0 {
                                            (bytes_since_last_update as f64) /
                                                (1024.0 * 1024.0) /
                                                time_since_update.as_secs_f64()
                                        } else {
                                            0.0
                                        };

                                        let _ = app.emit(
                                            "download-progress",
                                            serde_json::json!({
                                                "filename": filename,
                                                "downloaded": downloaded,
                                                "total": file_size,
                                                "progress": progress,
                                                "speed": speed_mbps,
                                                "message": "Downloading..."
                                            })
                                        );

                                        last_progress_percentage = progress;
                                        last_update_time = Instant::now();
                                        bytes_since_last_update = 0;
                                    }
                                }
                                Err(e) => {
                                    return Err(format!("Failed to write to file: {}", e));
                                }
                            }
                        }
                        Err(e) => {
                            if e.is_timeout() {
                                chunk_timeout = true;
                                break;
                            }
                            return Err(format!("Error downloading: {}", e));
                        }
                    }
                }

                if !chunk_timeout {
                    if file_size == 0 || downloaded >= file_size {
                        let _ = app.emit(
                            "download-completed",
                            serde_json::json!({
                                "filename": filename,
                                "size": downloaded
                            })
                        );
                        return Ok(());
                    }
                }

                retry_count += 1;
            }
            Err(e) => {
                if e.is_timeout() {
                    retry_count += 1;
                    continue;
                }
                return Err(format!("Request error: {}", e));
            }
        }
    }

    Err(format!("Failed to download after {} retries", MAX_RETRIES))
}

#[tauri::command]
fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    if !path.is_file() {
        return Err(format!("{} is not a file", file_path));
    }

    match fs::remove_file(path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri_plugin_deep_link::prepare("com.solarisfn.org");

    tauri::Builder
        ::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(DownloadManager::new())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app
                    .handle()
                    .plugin(
                        tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build()
                    )?;
            }

            let window = app.get_webview_window("main").unwrap();

            window.on_window_event(|event| {
                match event {
                    WindowEvent::Resized(..) =>
                        std::thread::sleep(std::time::Duration::from_nanos(1)),
                    _ => {}
                }
            });

            tauri_plugin_deep_link
                ::register("solaris", move |request| {
                    let re = Regex::new(r"solaris://([^/]+)").unwrap();

                    if let Err(err) = window.set_focus() {
                        eprintln!("Could not set focus on main window: {:?}", err);
                    }

                    if let Some(captures) = re.captures(request.as_str()) {
                        if let Some(result) = captures.get(1) {
                            window
                                .eval(&format!("window.location.hash = '{}'", result.as_str()))
                                .unwrap();
                        }
                    }
                })
                .unwrap();
            Ok(())
        })
        .invoke_handler(
            tauri::generate_handler![
                search_for_version,
                get_fortnite_processid,
                check_file_exists,
                exit_all,
                check_game_exists,
                check_file_exists_and_size,
                rich_presence,
                experience,
                download_game_file,
                download_build,
                is_download_active,
                is_extraction_active,
                cancel_download,
                cancel_extraction,
                delete_file,
                get_default_install_dir,
                get_available_versions,
                get_manifest_for_version
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
