use regex::Regex;
use tauri::Manager;
use tauri::WindowEvent;
use std::os::windows::process::CommandExt;
use std::fs::File;
use std::io::Read;

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
            tauri::generate_handler![search_for_version, get_fortnite_processid, check_file_exists]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
