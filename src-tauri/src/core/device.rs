use rdev::{Event, EventType, listen};
use serde::Serialize;
use serde_json::{Value, json};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};

#[cfg(target_os = "linux")]
mod linux_evdev;

static IS_RUNNING: AtomicBool = AtomicBool::new(false);

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

pub fn start_listening(app_handle: AppHandle) {
    if IS_RUNNING.load(Ordering::SeqCst) {
        return;
    }

    IS_RUNNING.store(true, Ordering::SeqCst);

    #[cfg(target_os = "linux")]
    {
        let wayland = linux_evdev::is_wayland();
        if wayland {
            println!(
                "[device] Wayland detected – using evdev for global input."
            );
            linux_evdev::start_evdev_listener(app_handle);
            return;
        }
        // X11: fall through to rdev listener below.
        println!("[device] X11 detected – using rdev for global input.");
    }

    let callback = move |event: Event| {
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

        if let Err(e) = app_handle.emit("device-changed", device) {
            eprintln!("Failed to emit event: {:?}", e);
        }
    };

    #[cfg(target_os = "macos")]
    if let Err(e) = listen(callback) {
        eprintln!("Device listening error: {:?}", e);
    }

    #[cfg(not(target_os = "macos"))]
    std::thread::spawn(move || {
        if let Err(e) = listen(callback) {
            eprintln!("Device listening error: {:?}", e);
        }
    });
}

/// Stop the global input listener.
///
/// On Linux/Wayland this signals evdev threads to exit.
/// The rdev‑based listeners (X11, macOS) do not have a reliable stop
/// mechanism and will keep running until the process exits.
pub fn stop_listening() {
    IS_RUNNING.store(false, Ordering::SeqCst);
    #[cfg(target_os = "linux")]
    linux_evdev::stop_evdev_listener();
}
