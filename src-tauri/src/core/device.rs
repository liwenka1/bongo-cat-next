use rdev::{Event, EventType, listen};
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

/// Convert an rdev `Event` into zero or more app-level `DeviceEvent`s.
///
/// Shared by every platform so the event format stays identical regardless of
/// which rdev backend (Windows hooks / X11 / macOS CGEventTap) produced it.
///
/// On macOS, Caps Lock is delivered via `FlagsChanged` rather than a normal
/// physical `KeyUp`.  The rdev backend maps the first toggle to `KeyPress`
/// but never produces a matching `KeyRelease`.  So on macOS we emit a
/// synthetic `KeyboardRelease` immediately after the `KeyboardPress` for
/// Caps Lock, making the key behave like a tap instead of getting "stuck".
fn rdev_event_to_device_event(event: Event) -> Vec<DeviceEvent> {
    let mut events = Vec::new();
    match event.event_type {
        EventType::ButtonPress(button) => events.push(DeviceEvent {
            kind: DeviceKind::MousePress,
            value: json!(format!("{:?}", button)),
        }),
        EventType::ButtonRelease(button) => events.push(DeviceEvent {
            kind: DeviceKind::MouseRelease,
            value: json!(format!("{:?}", button)),
        }),
        EventType::MouseMove { x, y } => events.push(DeviceEvent {
            kind: DeviceKind::MouseMove,
            value: json!({ "x": x, "y": y }),
        }),
        EventType::KeyPress(key) => {
            let value = json!(format!("{:?}", key));
            events.push(DeviceEvent {
                kind: DeviceKind::KeyboardPress,
                value: value.clone(),
            });
            // On macOS Caps Lock is a toggle delivered via FlagsChanged;
            // there is never a KeyRelease for it.  Synthesise one so the
            // frontend doesn't keep the paw pressed forever.
            #[cfg(target_os = "macos")]
            if matches!(key, rdev::Key::CapsLock) {
                events.push(DeviceEvent {
                    kind: DeviceKind::KeyboardRelease,
                    value,
                });
            }
        }
        EventType::KeyRelease(key) => events.push(DeviceEvent {
            kind: DeviceKind::KeyboardRelease,
            value: json!(format!("{:?}", key)),
        }),
        _ => {}
    };
    events
}

// The Caps Lock synthetic-release behaviour is macOS-only (FlagsChanged),
// so the tests only compile/run on macOS.
#[cfg(all(test, target_os = "macos"))]
mod tests {
    use super::*;
    use std::time::SystemTime;

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

    #[test]
    fn caps_lock_press_is_followed_by_release() {
        let events = rdev_event_to_device_event(keyboard_event(EventType::KeyPress(
            rdev::Key::CapsLock,
        )));

        assert_eq!(events.len(), 2);
        assert!(matches!(events[0].kind, DeviceKind::KeyboardPress));
        assert!(matches!(events[1].kind, DeviceKind::KeyboardRelease));
        assert_eq!(events[0].value, json!("CapsLock"));
        assert_eq!(events[1].value, json!("CapsLock"));
    }

    #[test]
    fn other_key_press_is_not_affected() {
        let events = rdev_event_to_device_event(keyboard_event(EventType::KeyPress(
            rdev::Key::KeyA,
        )));

        assert_eq!(events.len(), 1);
        assert!(matches!(events[0].kind, DeviceKind::KeyboardPress));
        assert_eq!(events[0].value, json!("KeyA"));
    }
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
                for device in rdev_event_to_device_event(event) {
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
            for device in rdev_event_to_device_event(event) {
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
