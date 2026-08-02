use rdev::{Event, EventType, listen};
#[cfg(target_os = "macos")]
use rdev::Key;
use serde::Serialize;
use serde_json::{Value, json};
use std::sync::atomic::{AtomicBool, Ordering};
#[cfg(target_os = "macos")]
use std::sync::mpsc;
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

/// Convert an rdev `Event` into our app-level `DeviceEvent`.
///
/// Shared by every platform so the event format stays identical regardless of
/// which rdev backend (Windows hooks / X11 / macOS CGEventTap) produced it.
fn rdev_event_to_device_events(event: Event) -> Vec<DeviceEvent> {
    // macOS reports Caps Lock through `FlagsChanged`: turning it on becomes a
    // KeyPress, but there is no physical KeyUp event for the frontend to clear.
    // Treat it as a tap so the cat's paw always returns to its resting state.
    #[cfg(target_os = "macos")]
    let is_caps_lock_press = matches!(&event.event_type, EventType::KeyPress(Key::CapsLock));

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
        _ => return vec![],
    };

    let mut devices = vec![device];

    #[cfg(target_os = "macos")]
    if is_caps_lock_press {
        devices.push(DeviceEvent {
            kind: DeviceKind::KeyboardRelease,
            value: json!("CapsLock"),
        });
    }

    devices
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

    // macOS uses a CGEventTap driven by a CFRunLoop on the *calling* thread.
    //
    // Two hard requirements to keep the tap alive:
    //   1. NEVER run it on the main thread – `listen()` blocks forever, and
    //      macOS disables an event tap when its run loop isn't serviced
    //      within ~300ms (e.g. while dragging the window across screens).
    //   2. NEVER do slow work (Tauri IPC `emit`) inside the tap callback –
    //      it runs on the tap's run loop, so a stalled `emit` stalls the tap
    //      and gets it disabled by the system with no way to recover.
    // So: dedicated listener thread + channel forwarding to a dedicated
    // emitter thread. The tap callback only does a cheap channel send.
    #[cfg(target_os = "macos")]
    {
        let (tx, rx) = mpsc::sync_channel::<DeviceEvent>(256);

        // Emitter thread: receives events and does the (potentially slow) IPC.
        std::thread::spawn(move || {
            while let Ok(device) = rx.recv() {
                if let Err(e) = app_handle.emit("device-changed", device) {
                    eprintln!("Failed to emit event: {:?}", e);
                }
            }
        });

        // Listener thread: owns the CGEventTap / CFRunLoop.
        std::thread::spawn(move || {
            let callback = move |event: Event| {
                for device in rdev_event_to_device_events(event) {
                    // Bounded channel + try_send: the tap callback must NEVER
                    // block (macOS disables taps whose run loop stalls). If the
                    // emitter thread falls behind (e.g. frontend rendering is
                    // slow), the newest event is dropped instead — never blocks.
                    // Keyboard events are low-frequency and never hit the bound,
                    // so no keystrokes are lost in practice.
                    let _ = tx.try_send(device);
                }
            };
            if let Err(e) = listen(callback) {
                eprintln!("Device listening error: {:?}", e);
            }
        });
        return;
    }

    // Windows / Linux (X11): rdev uses system-level hooks
    // (SetWindowsHookEx / XRecord) that are not tied to our threads, so a
    // direct synchronous `emit` in the callback is fine. Still run on a
    // dedicated thread because `listen` blocks forever.
    #[cfg(not(target_os = "macos"))]
    std::thread::spawn(move || {
        let callback = move |event: Event| {
            for device in rdev_event_to_device_events(event) {
                if let Err(e) = app_handle.emit("device-changed", device) {
                    eprintln!("Failed to emit event: {:?}", e);
                }
            }
        };
        if let Err(e) = listen(callback) {
            eprintln!("Device listening error: {:?}", e);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    #[cfg(target_os = "macos")]
    use std::time::SystemTime;

    #[cfg(target_os = "macos")]
    fn keyboard_event(event_type: EventType) -> Event {
        Event {
            time: SystemTime::now(),
            unicode: None,
            event_type,
            platform_code: 0,
            position_code: 0,
            usb_hid: 0,
            extra_data: 0,
        }
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn caps_lock_press_is_followed_by_release() {
        let events = rdev_event_to_device_events(keyboard_event(EventType::KeyPress(Key::CapsLock)));

        assert_eq!(events.len(), 2);
        assert!(matches!(events[0].kind, DeviceKind::KeyboardPress));
        assert!(matches!(events[1].kind, DeviceKind::KeyboardRelease));
        assert_eq!(events[0].value, json!("CapsLock"));
        assert_eq!(events[1].value, json!("CapsLock"));
    }
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
