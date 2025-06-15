use rdev::{Event, EventType, listen};
use serde::Serialize;
use serde_json::{Value, json};
use std::sync::{Arc, Mutex, atomic::{AtomicBool, Ordering}};
use tauri::{AppHandle, Emitter};
use std::sync::OnceLock;

static IS_RUNNING: AtomicBool = AtomicBool::new(false);
static APP_HANDLE: OnceLock<Arc<Mutex<AppHandle>>> = OnceLock::new();

#[derive(Debug, Clone, Serialize)]
pub enum DeviceKind {
    MousePress,
    MouseRelease,
    MouseMove,
    KeyboardPress,
    KeyboardRelease,
}

#[derive(Debug, Clone, Serialize)]
pub struct DeviceEvent {
    kind: DeviceKind,
    value: Value,
}

fn device_callback(event: Event) {
    let device = match event.event_type {
        EventType::ButtonPress(button) => DeviceEvent {
            kind: DeviceKind::MousePress,
            value: json!(format!("{:?}", button)),
        },
        EventType::ButtonRelease(button) => DeviceEvent {
            kind: DeviceKind::MouseRelease,
            value: json!(format!("{:?}", button)),
        },
        EventType::MouseMove { x, y } => DeviceEvent {
            kind: DeviceKind::MouseMove,
            value: json!({ "x": x, "y": y }),
        },
        EventType::KeyPress(key) => DeviceEvent {
            kind: DeviceKind::KeyboardPress,
            value: json!(format!("{:?}", key)),
        },
        EventType::KeyRelease(key) => DeviceEvent {
            kind: DeviceKind::KeyboardRelease,
            value: json!(format!("{:?}", key)),
        },
        _ => return,
    };

    if let Some(app_handle_mutex) = APP_HANDLE.get() {
        if let Ok(app_handle) = app_handle_mutex.lock() {
            if let Err(e) = app_handle.emit("device-changed", device) {
                eprintln!("Failed to emit event: {:?}", e);
            }
        }
    }
}

pub fn start_listening(app_handle: AppHandle) {
    if IS_RUNNING.load(Ordering::SeqCst) {
        return;
    }

    IS_RUNNING.store(true, Ordering::SeqCst);
    
    // Store the app handle in the global static
    let _ = APP_HANDLE.set(Arc::new(Mutex::new(app_handle)));

    #[cfg(target_os = "macos")]
    if let Err(e) = listen(device_callback) {
        eprintln!("Device listening error: {:?}", e);
    }

    #[cfg(not(target_os = "macos"))]
    std::thread::spawn(move || {
        if let Err(e) = listen(device_callback) {
            eprintln!("Device listening error: {:?}", e);
        }
    });
} 