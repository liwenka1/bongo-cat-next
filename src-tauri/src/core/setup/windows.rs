use tauri::{AppHandle, WebviewWindow};

pub fn platform(
    _app_handle: &AppHandle,
    _main_window: WebviewWindow,
    _settings_window: WebviewWindow,
) {
    // Windows平台特定的初始化代码
} 