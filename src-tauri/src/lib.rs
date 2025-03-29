use declarative_discord_rich_presence::activity::{ Activity, Assets, Button, Timestamps };
use declarative_discord_rich_presence::DeclarativeDiscordIpcClient;
use regex::Regex;
use sysinfo::{ System, SystemExt };
use std::os::windows::process::CommandExt;
use std::path::PathBuf;
use tauri::Manager;
use tauri::WindowEvent;
use std::fs::File;
use std::io::Read;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Shell::ShellExecuteA;
use windows::Win32::UI::WindowsAndMessaging::SW_HIDE;
use std::ffi::CString;
use windows::core::PCSTR;
use winapi::um::winbase::CREATE_SUSPENDED;
use std::fs;
use std::path::Path;
use std::process::Stdio;
use std::io::Write;

const CREATE_NO_WINDOW: u32 = 0x08000000;

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
    use std::fs::File;
    use std::io::Write;
    use std::env;

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
    _version: String
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

        let _ = download_file("https://cdn.solarisfn.org/SolarisNew.dll", &game_dll);
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

    if dpe {
        fort_args.push("-nopreedits");
    }

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri_plugin_deep_link::prepare("com.solarisfn.org");

    tauri::Builder
        ::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
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
                rich_presence,
                experience
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
