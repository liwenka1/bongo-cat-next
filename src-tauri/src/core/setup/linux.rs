use tauri::{AppHandle, WebviewWindow};

pub fn platform(
    _app_handle: &AppHandle,
    _main_window: WebviewWindow,
) {
    // On Linux, global input monitoring via evdev (/dev/input/event*)
    // requires the user to be in the `input` group (or `plugdev` on some
    // distros).  If events don't arrive, run:
    //
    //     sudo usermod -a -G input $USER
    //
    // then log out and back in.

    // Detect Wayland and log a hint – rdev's X11 listener won't work.
    let wayland = std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v == "wayland")
            .unwrap_or(false);

    if wayland {
        println!(
            "[setup/linux] Wayland detected – using evdev for global input.\n\
             Make sure your user is in the 'input' group."
        );
    } else {
        println!("[setup/linux] X11 detected – using rdev + evdev for global input.");
    }
}
