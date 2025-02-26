use regex::Regex;
use tauri::Manager;
use tauri::WindowEvent;

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
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
