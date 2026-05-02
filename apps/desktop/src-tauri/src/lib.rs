mod commands;
mod core;
mod storage;
mod types;
mod utils;

use commands::{bridge, hotkey, permissions, settings, tray, window};
use core::setup;
use tauri::{generate_handler, Manager, WindowEvent};

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(hotkey::AssistantHotkeyState::default())
        .setup(|app| {
            let app_handle = app.handle();

            storage::ensure_data_files()
                .map_err(|error| std::io::Error::other(error))?;

            let main_window = app
                .get_webview_window(window::MAIN_WINDOW_LABEL)
                .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "Main window not found"))?;

            setup::default(&app_handle, main_window.clone());
            tray::init();
            hotkey::initialize_saved_hotkey(&app_handle)
                .map_err(std::io::Error::other)?;

            println!("BongoCat manager shell started successfully!");

            Ok(())
        })
        .invoke_handler(generate_handler![
            get_app_version,
            window::show_main_window,
            settings::load_settings_bundle,
            settings::save_settings_bundle,
            permissions::load_permissions,
            permissions::save_permissions,
            hotkey::register_assistant_hotkey,
            bridge::open_app,
            bridge::open_url,
            bridge::run_command,
            bridge::file_search,
            commands::pet_app::get_pet_app_status,
            commands::pet_app::launch_pet_app,
            commands::pet_app::stop_pet_app,
            commands::pet_app::reveal_pet_app
        ])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    hotkey::on_shortcut_event(app, shortcut, event);
                })
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window(window::MAIN_WINDOW_LABEL) {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .on_window_event(|window, event| {
            if window.label() == window::MAIN_WINDOW_LABEL {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    window.app_handle().exit(0);
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, event| match event {
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            let _ = window::show_main_window(_app_handle.clone());
        }
        _ => {}
    });
}
