// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};

mod device;

use tauri::{Manager, WindowEvent, generate_handler};

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            
            // 获取主窗口
            if let Some(main_window) = app.get_webview_window("main") {
                // 启动设备监听
                device::start_listening(app_handle.clone());
                
                println!("BongoCat Next started successfully!");
            }

            Ok(())
        })
        .invoke_handler(generate_handler![get_app_version])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app_handle, _argv, _cwd| {
            // 单实例处理：如果已有实例运行，显示设置窗口
            if let Some(settings_window) = app_handle.get_webview_window("settings") {
                let _ = settings_window.show();
                let _ = settings_window.set_focus();
            }
        }))
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                // 防止主窗口被关闭，而是隐藏
                if window.label() == "main" {
                    let _ = window.hide();
                    api.prevent_close();
                } else {
                    // 设置窗口可以正常关闭
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application");

    app.run(|_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            // 阻止应用完全退出
            api.prevent_exit();
        }
        _ => {}
    });
}
