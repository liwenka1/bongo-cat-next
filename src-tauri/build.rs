use std::path::Path;

fn main() {
    // Ensure icons directory exists and has required files
    let icons_dir = Path::new("icons");
    if !icons_dir.exists() {
        panic!("Icons directory not found: {:?}", icons_dir);
    }
    
    // Check required icon files
    let required_icons = [
        "icons/32x32.png",
        "icons/128x128.png", 
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
    ];
    
    for icon in &required_icons {
        let icon_path = Path::new(icon);
        if !icon_path.exists() {
            panic!("Required icon not found: {:?}", icon_path);
        }
        println!("cargo:rerun-if-changed={}", icon);
    }
    
    tauri_build::build()
}
