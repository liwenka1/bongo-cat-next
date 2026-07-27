// Linux evdev-based global input listener.
//
// On Linux, `rdev::listen()` uses X11's XRecord extension which does not work
// under Wayland compositors (Hyprland, Sway, etc.). This module reads directly
// from /dev/input/event* devices via the kernel evdev subsystem, which works
// on both X11 and Wayland.
//
// ## Requirements
//
// The user must have read access to /dev/input/event*.  The recommended way
// is to add your user to the `input` group:
//
//     sudo usermod -a -G input $USER
//     # log out and back in
//
// On some distributions the group may be called `plugdev`.

use evdev::{Device, EventSummary, KeyCode};
use serde_json::json;
use std::path::PathBuf;

use super::{DeviceEvent, DeviceKind};

/// Check whether the current session is running under Wayland.
pub fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v == "wayland")
            .unwrap_or(false)
}

/// Scan /dev/input for evdev device paths that look like keyboards or mice.
fn find_input_device_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let dir = match std::fs::read_dir("/dev/input") {
        Ok(d) => d,
        Err(e) => {
            eprintln!("[linux_evdev] Cannot read /dev/input: {e}");
            return paths;
        }
    };

    for entry in dir.flatten() {
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if !name.starts_with("event") {
            continue;
        }

        // Quick-open to query capabilities; drop immediately so the
        // per-device worker thread can open it again.
        match Device::open(&path) {
            Ok(dev) => {
                let has_keys = dev.supported_keys().map_or(false, |k| !k.is_empty());
                let has_rel = dev
                    .supported_relative_axes()
                    .map_or(false, |a| !a.is_empty());
                let has_abs = dev
                    .supported_absolute_axes()
                    .map_or(false, |a| !a.is_empty());

                if has_keys || has_rel || has_abs {
                    paths.push(path);
                }
            }
            Err(e) => {
                eprintln!("[linux_evdev] Cannot open {}: {e}", path.display());
            }
        }
    }
    paths
}

/// Return `true` when `key` looks like a mouse button.
fn is_mouse_button(key: &KeyCode) -> bool {
    matches!(
        key,
        KeyCode::BTN_LEFT
            | KeyCode::BTN_RIGHT
            | KeyCode::BTN_MIDDLE
            | KeyCode::BTN_SIDE
            | KeyCode::BTN_EXTRA
            | KeyCode::BTN_FORWARD
            | KeyCode::BTN_BACK
            | KeyCode::BTN_TASK
    )
}

/// Convert an evdev `EventSummary` into our app-level `DeviceEvent`, or
/// `None` if the event is uninteresting (e.g. SYN_REPORT).
fn convert_event(summary: EventSummary) -> Option<DeviceEvent> {
    match summary {
        // --- Keyboard keys ---
        EventSummary::Key(_, key, 1) if !is_mouse_button(&key) => Some(DeviceEvent {
            kind: DeviceKind::KeyboardPress,
            value: json!(format!("{key:?}")),
        }),
        EventSummary::Key(_, key, 0) if !is_mouse_button(&key) => Some(DeviceEvent {
            kind: DeviceKind::KeyboardRelease,
            value: json!(format!("{key:?}")),
        }),

        // --- Mouse buttons ---
        EventSummary::Key(_, btn, 1) if is_mouse_button(&btn) => Some(DeviceEvent {
            kind: DeviceKind::MousePress,
            value: json!(format!("{btn:?}")),
        }),
        EventSummary::Key(_, btn, 0) if is_mouse_button(&btn) => Some(DeviceEvent {
            kind: DeviceKind::MouseRelease,
            value: json!(format!("{btn:?}")),
        }),

        // --- Relative axes (mouse movement & scroll) ---
        EventSummary::RelativeAxis(_, axis, value) => Some(DeviceEvent {
            kind: DeviceKind::MouseMove,
            value: json!({
                "axis": format!("{axis:?}"),
                "value": value,
            }),
        }),

        // --- Absolute axes (touch screens, drawing tablets) – treat as
        //     mouse move so the cat reacts ---
        EventSummary::AbsoluteAxis(_, axis, value) => Some(DeviceEvent {
            kind: DeviceKind::MouseMove,
            value: json!({
                "axis": format!("{axis:?}"),
                "value": value,
            }),
        }),

        _ => None,
    }
}

/// Spawn one OS thread per evdev device.  Each thread blocks on
/// `fetch_events()` (which is fine – the kernel wakes us when events
/// arrive) and emits `device-changed` to the Tauri frontend.
pub fn start_evdev_listener(app_handle: tauri::AppHandle) {
    let paths = find_input_device_paths();

    if paths.is_empty() {
        eprintln!(
            "[linux_evdev] No accessible input devices in /dev/input/.\n\
             Make sure your user is in the 'input' group:\n\
               sudo usermod -a -G input $USER\n\
             Then log out and back in."
        );
        return;
    }

    println!(
        "[linux_evdev] Found {} input device(s): {:?}",
        paths.len(),
        paths
    );

    for path in paths {
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            let mut dev = match Device::open(&path) {
                Ok(d) => d,
                Err(e) => {
                    eprintln!("[linux_evdev] Failed to open {}: {e}", path.display());
                    return;
                }
            };

            println!("[linux_evdev] Listening on {}", path.display());

            loop {
                match dev.fetch_events() {
                    Ok(events) => {
                        for ev in events {
                            if let Some(de) = convert_event(ev.destructure()) {
                                if let Err(e) = handle.emit("device-changed", de) {
                                    eprintln!(
                                        "[linux_evdev] Failed to emit event: {e}"
                                    );
                                }
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!(
                            "[linux_evdev] Error reading {}: {e}",
                            path.display()
                        );
                        // If we lose a device, stop this worker rather
                        // than spinning in an error loop.
                        break;
                    }
                }
            }
        });
    }
}
