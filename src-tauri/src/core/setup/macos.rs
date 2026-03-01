use tauri::{AppHandle, WebviewWindow};

#[link(name = "ApplicationServices", kind = "framework")]
unsafe extern "C" {
    fn CGPreflightListenEventAccess() -> bool;
}

fn has_input_monitoring_permission() -> bool {
    unsafe { CGPreflightListenEventAccess() }
}

pub fn platform(_app_handle: &AppHandle, _main_window: WebviewWindow) {
    let has_input = has_input_monitoring_permission();

    if !has_input {
        eprintln!(
            "macOS input monitoring permission is missing. \
Please enable this app in Privacy & Security -> Input Monitoring."
        );
    }
}