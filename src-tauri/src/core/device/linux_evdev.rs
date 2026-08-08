// Linux evdev-based global input listener.
//
// On Linux, `rdev::listen()` uses X11's XRecord extension which does not work
// under Wayland compositors (Hyprland, Sway, etc.). This module reads directly
// from /dev/input/event* devices via the kernel evdev subsystem, which works
// on both X11 and Wayland.
//
// ## Event contract
//
// Events emitted through this module MUST match the rdev naming conventions
// exactly because the frontend (`use-keyboard.ts`, `_use-mouse-events.ts`)
// expects rdev-style key/button names and `{ x, y }` MouseMove format.
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

use evdev::{
    AbsoluteAxisCode, Device, EventSummary, KeyCode, RelativeAxisCode,
};
use serde_json::json;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

use super::{DeviceEvent, DeviceKind};

// ---------------------------------------------------------------------------
// Wayland detection
// ---------------------------------------------------------------------------

/// Check whether the current session is running under Wayland.
pub fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v == "wayland")
            .unwrap_or(false)
}

// ---------------------------------------------------------------------------
// Device scanning with deduplication
// ---------------------------------------------------------------------------

/// Scan /dev/input for evdev device paths that look like keyboards or mice,
/// deduplicating devices that expose multiple event nodes.
fn find_input_device_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let mut seen = HashSet::new();

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

        // Quick-open to query capabilities and identity.
        match Device::open(&path) {
            Ok(dev) => {
                let has_keys = dev.supported_keys().map_or(false, |k| k.iter().next().is_some());
                let has_rel = dev
                    .supported_relative_axes()
                    .map_or(false, |a| a.iter().next().is_some());
                let has_abs = dev
                    .supported_absolute_axes()
                    .map_or(false, |a| a.iter().next().is_some());

                if !has_keys && !has_rel && !has_abs {
                    continue;
                }

                // Dedup by device name so that keyboards with multiple event
                // nodes (multimedia keys, extra buttons) only get ONE thread.
                if let Some(dev_name) = dev.name() {
                    if !seen.insert(dev_name.to_string()) {
                        continue;
                    }
                }

                paths.push(path);
            }
            Err(e) => {
                eprintln!(
                    "[linux_evdev] Cannot open {}: {e}",
                    path.display()
                );
            }
        }
    }
    paths
}

// ---------------------------------------------------------------------------
// Key / button name mapping → rdev-compatible strings
// ---------------------------------------------------------------------------

/// Map an evdev `KeyCode` to the **exact** `Debug` output of the corresponding
/// `rdev::Key` variant.  Returns `None` for keys that rdev doesn't expose.
fn rdev_key_name(key: &KeyCode) -> Option<&'static str> {
    Some(match *key {
        // ── letters ──────────────────────────────────────────────────
        KeyCode::KEY_A => "KeyA",
        KeyCode::KEY_B => "KeyB",
        KeyCode::KEY_C => "KeyC",
        KeyCode::KEY_D => "KeyD",
        KeyCode::KEY_E => "KeyE",
        KeyCode::KEY_F => "KeyF",
        KeyCode::KEY_G => "KeyG",
        KeyCode::KEY_H => "KeyH",
        KeyCode::KEY_I => "KeyI",
        KeyCode::KEY_J => "KeyJ",
        KeyCode::KEY_K => "KeyK",
        KeyCode::KEY_L => "KeyL",
        KeyCode::KEY_M => "KeyM",
        KeyCode::KEY_N => "KeyN",
        KeyCode::KEY_O => "KeyO",
        KeyCode::KEY_P => "KeyP",
        KeyCode::KEY_Q => "KeyQ",
        KeyCode::KEY_R => "KeyR",
        KeyCode::KEY_S => "KeyS",
        KeyCode::KEY_T => "KeyT",
        KeyCode::KEY_U => "KeyU",
        KeyCode::KEY_V => "KeyV",
        KeyCode::KEY_W => "KeyW",
        KeyCode::KEY_X => "KeyX",
        KeyCode::KEY_Y => "KeyY",
        KeyCode::KEY_Z => "KeyZ",

        // ── digits (main row) ───────────────────────────────────────
        KeyCode::KEY_0 => "Key0",
        KeyCode::KEY_1 => "Key1",
        KeyCode::KEY_2 => "Key2",
        KeyCode::KEY_3 => "Key3",
        KeyCode::KEY_4 => "Key4",
        KeyCode::KEY_5 => "Key5",
        KeyCode::KEY_6 => "Key6",
        KeyCode::KEY_7 => "Key7",
        KeyCode::KEY_8 => "Key8",
        KeyCode::KEY_9 => "Key9",

        // ── function keys ───────────────────────────────────────────
        KeyCode::KEY_F1 => "F1",
        KeyCode::KEY_F2 => "F2",
        KeyCode::KEY_F3 => "F3",
        KeyCode::KEY_F4 => "F4",
        KeyCode::KEY_F5 => "F5",
        KeyCode::KEY_F6 => "F6",
        KeyCode::KEY_F7 => "F7",
        KeyCode::KEY_F8 => "F8",
        KeyCode::KEY_F9 => "F9",
        KeyCode::KEY_F10 => "F10",
        KeyCode::KEY_F11 => "F11",
        KeyCode::KEY_F12 => "F12",

        // ── navigation / editing ────────────────────────────────────
        KeyCode::KEY_ESC => "Escape",
        KeyCode::KEY_TAB => "Tab",
        KeyCode::KEY_ENTER => "Return",
        KeyCode::KEY_BACKSPACE => "Backspace",
        KeyCode::KEY_SPACE => "Space",
        KeyCode::KEY_DELETE => "Delete",
        KeyCode::KEY_HOME => "Home",
        KeyCode::KEY_END => "End",
        KeyCode::KEY_PAGEUP => "PageUp",
        KeyCode::KEY_PAGEDOWN => "PageDown",
        KeyCode::KEY_INSERT => "Insert",
        KeyCode::KEY_MENU => "Menu",

        // ── arrows ──────────────────────────────────────────────────
        KeyCode::KEY_UP => "UpArrow",
        KeyCode::KEY_DOWN => "DownArrow",
        KeyCode::KEY_LEFT => "LeftArrow",
        KeyCode::KEY_RIGHT => "RightArrow",

        // ── modifiers ───────────────────────────────────────────────
        KeyCode::KEY_LEFTCTRL => "ControlLeft",
        KeyCode::KEY_RIGHTCTRL => "ControlRight",
        KeyCode::KEY_LEFTSHIFT => "ShiftLeft",
        KeyCode::KEY_RIGHTSHIFT => "ShiftRight",
        KeyCode::KEY_LEFTALT => "AltLeft",
        KeyCode::KEY_RIGHTALT => "AltRight",
        KeyCode::KEY_LEFTMETA => "MetaLeft",
        KeyCode::KEY_RIGHTMETA => "MetaRight",

        // ── lock keys ───────────────────────────────────────────────
        KeyCode::KEY_CAPSLOCK => "CapsLock",
        KeyCode::KEY_NUMLOCK => "NumLock",
        KeyCode::KEY_SCROLLLOCK => "ScrollLock",

        // ── system keys ─────────────────────────────────────────────
        KeyCode::KEY_SYSRQ => "PrintScreen",
        KeyCode::KEY_PAUSE => "Pause",

        // ── symbols (US layout names matching rdev) ─────────────────
        KeyCode::KEY_GRAVE => "BackQuote",
        KeyCode::KEY_MINUS => "Minus",
        KeyCode::KEY_EQUAL => "Equal",
        KeyCode::KEY_LEFTBRACE => "BracketLeft",
        KeyCode::KEY_RIGHTBRACE => "BracketRight",
        KeyCode::KEY_SEMICOLON => "Semicolon",
        KeyCode::KEY_APOSTROPHE => "Quote",
        KeyCode::KEY_BACKSLASH => "BackSlash",
        KeyCode::KEY_COMMA => "Comma",
        KeyCode::KEY_DOT => "Period",
        KeyCode::KEY_SLASH => "Slash",
        // ISO key (left of Z on some layouts)
        KeyCode::KEY_102ND => "IntlBackslash",

        // ── numpad ──────────────────────────────────────────────────
        KeyCode::KEY_KP0 => "Numpad0",
        KeyCode::KEY_KP1 => "Numpad1",
        KeyCode::KEY_KP2 => "Numpad2",
        KeyCode::KEY_KP3 => "Numpad3",
        KeyCode::KEY_KP4 => "Numpad4",
        KeyCode::KEY_KP5 => "Numpad5",
        KeyCode::KEY_KP6 => "Numpad6",
        KeyCode::KEY_KP7 => "Numpad7",
        KeyCode::KEY_KP8 => "Numpad8",
        KeyCode::KEY_KP9 => "Numpad9",
        KeyCode::KEY_KPPLUS => "NumpadAdd",
        KeyCode::KEY_KPMINUS => "NumpadSubtract",
        KeyCode::KEY_KPASTERISK => "NumpadMultiply",
        KeyCode::KEY_KPSLASH => "NumpadDivide",
        KeyCode::KEY_KPDOT => "NumpadDecimal",
        KeyCode::KEY_KPENTER => "NumpadEnter",

        // ── multimedia (rdev exposes some of these) ─────────────────
        KeyCode::KEY_PLAYPAUSE => "PlayPause",
        KeyCode::KEY_NEXTSONG => "NextTrack",
        KeyCode::KEY_PREVIOUSSONG => "PreviousTrack",
        KeyCode::KEY_STOPCD => "Stop",
        KeyCode::KEY_MUTE => "Mute",
        KeyCode::KEY_VOLUMEUP => "VolumeUp",
        KeyCode::KEY_VOLUMEDOWN => "VolumeDown",
        KeyCode::KEY_CALC => "Calculator",
        KeyCode::KEY_MAIL => "Mail",
        KeyCode::KEY_HOMEPAGE => "BrowserHome",
        KeyCode::KEY_SEARCH => "Search",

        _ => return None,
    })
}

/// Map an evdev mouse-button `KeyCode` to the **exact** `Debug` output of
/// the corresponding `rdev::Button` variant.
fn rdev_button_name(key: &KeyCode) -> Option<&'static str> {
    Some(match *key {
        KeyCode::BTN_LEFT => "Left",
        KeyCode::BTN_RIGHT => "Right",
        KeyCode::BTN_MIDDLE => "Middle",
        KeyCode::BTN_SIDE => "Side",
        KeyCode::BTN_EXTRA => "Extra",
        KeyCode::BTN_FORWARD => "Forward",
        KeyCode::BTN_BACK => "Back",
        KeyCode::BTN_TASK => "Task",
        _ => return None,
    })
}

// ---------------------------------------------------------------------------
// Event conversion ─ evdev → rdev‑compatible DeviceEvent
// ---------------------------------------------------------------------------

/// Convert an evdev `EventSummary` into our app-level `DeviceEvent`.
///
/// `cursor` is mutable shared state for tracking a virtual absolute mouse
/// position (accumulated from relative-axis events).
/// `screen_w` / `screen_h` are the primary monitor dimensions.
fn convert_event(
    summary: EventSummary,
    cursor: &mut (i32, i32),
    screen_w: i32,
    screen_h: i32,
) -> Option<DeviceEvent> {
    match summary {
        // ── keyboard & mouse buttons (press) ────────────────────────
        EventSummary::Key(_, key, 1) => {
            // Mouse buttons first (precedence).
            if let Some(name) = rdev_button_name(&key) {
                return Some(DeviceEvent {
                    kind: DeviceKind::MousePress,
                    value: json!(name),
                });
            }
            if let Some(name) = rdev_key_name(&key) {
                return Some(DeviceEvent {
                    kind: DeviceKind::KeyboardPress,
                    value: json!(name),
                });
            }
            None
        }

        // ── keyboard & mouse buttons (release) ──────────────────────
        EventSummary::Key(_, key, 0) => {
            if let Some(name) = rdev_button_name(&key) {
                return Some(DeviceEvent {
                    kind: DeviceKind::MouseRelease,
                    value: json!(name),
                });
            }
            if let Some(name) = rdev_key_name(&key) {
                return Some(DeviceEvent {
                    kind: DeviceKind::KeyboardRelease,
                    value: json!(name),
                });
            }
            None
        }

        // ── relative axes (mouse movement / scroll) ─────────────────
        EventSummary::RelativeAxis(_, axis, value) => {
            match axis {
                RelativeAxisCode::REL_X => {
                    cursor.0 = (cursor.0 + value).clamp(0, screen_w);
                }
                RelativeAxisCode::REL_Y => {
                    cursor.1 = (cursor.1 + value).clamp(0, screen_h);
                }
                _ => {
                    // Wheel and other relative axes are not relevant
                    // for bongo-cat mouse tracking.
                    return None;
                }
            }
            Some(DeviceEvent {
                kind: DeviceKind::MouseMove,
                value: json!({ "x": cursor.0, "y": cursor.1 }),
            })
        }

        // ── absolute axes (touch screens, drawing tablets) ─────────
        EventSummary::AbsoluteAxis(_, axis, value) => {
            match axis {
                AbsoluteAxisCode::ABS_X => {
                    cursor.0 = value.clamp(0, screen_w);
                }
                AbsoluteAxisCode::ABS_Y => {
                    cursor.1 = value.clamp(0, screen_h);
                }
                _ => return None,
            }
            Some(DeviceEvent {
                kind: DeviceKind::MouseMove,
                value: json!({ "x": cursor.0, "y": cursor.1 }),
            })
        }

        _ => None,
    }
}

// ---------------------------------------------------------------------------
// Shutdown flag
// ---------------------------------------------------------------------------

static STOP: AtomicBool = AtomicBool::new(false);

/// Signal all evdev listener threads to exit.
pub fn stop_evdev_listener() {
    STOP.store(true, Ordering::SeqCst);
}

// ---------------------------------------------------------------------------
// Start evdev listener
// ---------------------------------------------------------------------------

/// Spawn one OS thread per evdev device.  Each thread blocks on
/// `fetch_events()` (the kernel wakes us when events arrive) and emits
/// `device-changed` to the Tauri frontend with rdev‑compatible event format.
pub fn start_evdev_listener(app_handle: tauri::AppHandle) {
    STOP.store(false, Ordering::SeqCst);

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

    // Obtain primary monitor size for cursor clamping.
    let (screen_w, screen_h) = app_handle
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| {
            let size = m.size();
            (size.width as i32, size.height as i32)
        })
        .unwrap_or((1920, 1080));
    let center_x = screen_w / 2;
    let center_y = screen_h / 2;

    for path in paths {
        let handle = app_handle.clone();
        std::thread::spawn(move || {
            let mut dev = match Device::open(&path) {
                Ok(d) => d,
                Err(e) => {
                    eprintln!(
                        "[linux_evdev] Failed to open {}: {e}",
                        path.display()
                    );
                    return;
                }
            };

            println!("[linux_evdev] Listening on {}", path.display());

            let mut cursor = (center_x, center_y);

            loop {
                if STOP.load(Ordering::Relaxed) {
                    break;
                }

                match dev.fetch_events() {
                    Ok(events) => {
                        for ev in events {
                            if let Some(de) = convert_event(
                                ev.destructure(),
                                &mut cursor,
                                screen_w,
                                screen_h,
                            ) {
                                if let Err(e) =
                                    handle.emit("device-changed", de)
                                {
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
                        // Device removed – stop this worker.
                        break;
                    }
                }
            }
        });
    }
}
