mod core;
mod utils;

use core::{device, setup};
use tauri::{Manager, WindowEvent, generate_handler};

const MAIN_WINDOW_LABEL: &str = "main";

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn show_settings_window(_app_handle: &tauri::AppHandle) {
    println!("Settings window functionality has been removed");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let _app_handle = app.handle();

            let main_window = app.get_webview_window(MAIN_WINDOW_LABEL).unwrap();

            setup::default(&_app_handle, main_window.clone());

            device::start_listening(_app_handle.clone());

            println!("BongoCat Next started successfully!");

            Ok(())
        })
        .invoke_handler(generate_handler![get_app_version])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let windows = app.webview_windows();
            
            windows
                .values()
                .next()
                .expect("Sorry, no window found")
                .set_focus()
                .expect("Can't focus on the main window");
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                let _ = window.hide();
                api.prevent_close();
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, event| match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            show_settings_window(_app_handle);
        }
        _ => {}
    });
}
