use serde::Serialize;
use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Manager};

const PET_EXE_PREFIX: &str = "BongoCat_";
const PET_EXE_SUFFIX: &str = "_pyqt5_win11_x64.exe";
const BUNDLED_PET_RESOURCE_DIR: &str = "pet-app";

fn run_output_hidden(command: &mut Command) -> Result<std::process::Output, std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.output()
}

fn spawn_hidden(command: &mut Command) -> Result<(), std::io::Error> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;

        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.spawn().map(|_| ())
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExternalPetAppStatus {
    pub available: bool,
    pub running: bool,
    pub executable_path: Option<String>,
    pub executable_name: Option<String>,
    pub pid: Option<u32>,
    pub message: String,
}

fn push_candidate(candidates: &mut Vec<PathBuf>, seen: &mut BTreeSet<PathBuf>, path: PathBuf) {
    if seen.insert(path.clone()) {
        candidates.push(path);
    }
}

fn collect_ancestors(candidates: &mut Vec<PathBuf>, seen: &mut BTreeSet<PathBuf>, start: Option<PathBuf>) {
    if let Some(path) = start {
        push_candidate(candidates, seen, path.clone());
        for ancestor in path.ancestors() {
            push_candidate(candidates, seen, ancestor.to_path_buf());
        }
    }
}

fn collect_candidate_roots(app_handle: Option<&AppHandle>) -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    let mut seen = BTreeSet::new();

    if let Some(app_handle) = app_handle {
        if let Ok(resource_dir) = app_handle.path().resource_dir() {
            push_candidate(
                &mut candidates,
                &mut seen,
                resource_dir.join(BUNDLED_PET_RESOURCE_DIR),
            );
            push_candidate(&mut candidates, &mut seen, resource_dir);
        }
    }

    collect_ancestors(
        &mut candidates,
        &mut seen,
        env::current_exe()
            .ok()
            .and_then(|path| path.parent().map(Path::to_path_buf)),
    );
    collect_ancestors(&mut candidates, &mut seen, env::current_dir().ok());

    candidates
}

fn is_pyqt_pet_executable_name(name: &str) -> bool {
    name.starts_with(PET_EXE_PREFIX) && name.ends_with(PET_EXE_SUFFIX)
}

fn find_pet_executable(app_handle: Option<&AppHandle>) -> Option<PathBuf> {
    let mut best_match: Option<(SystemTime, PathBuf)> = None;

    for root in collect_candidate_roots(app_handle) {
        let Ok(entries) = fs::read_dir(&root) else {
            continue;
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }

            let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
                continue;
            };

            if !is_pyqt_pet_executable_name(name) {
                continue;
            }

            let modified_at = entry
                .metadata()
                .and_then(|metadata| metadata.modified())
                .unwrap_or(SystemTime::UNIX_EPOCH);

            match &best_match {
                Some((current_modified_at, _)) if *current_modified_at >= modified_at => {}
                _ => {
                    best_match = Some((modified_at, path));
                }
            }
        }
    }

    best_match.map(|(_, path)| path)
}

fn parse_tasklist_line(line: &str) -> Option<(String, u32)> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }

    let without_quotes = trimmed.strip_prefix('"')?.strip_suffix('"')?;
    let mut columns = without_quotes.split("\",\"");
    let image_name = columns.next()?.to_string();
    let pid = columns.next()?.parse::<u32>().ok()?;
    Some((image_name, pid))
}

fn find_running_pet_process(executable_name: Option<&str>) -> Option<(String, u32)> {
    let output = run_output_hidden(Command::new("tasklist").args(["/FO", "CSV", "/NH"])).ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let Some((image_name, pid)) = parse_tasklist_line(line) else {
            continue;
        };

        let matches = if let Some(target_name) = executable_name {
            image_name.eq_ignore_ascii_case(target_name) || is_pyqt_pet_executable_name(&image_name)
        } else {
            is_pyqt_pet_executable_name(&image_name)
        };

        if matches {
            return Some((image_name, pid));
        }
    }

    None
}

fn build_pet_app_status(app_handle: Option<&AppHandle>) -> ExternalPetAppStatus {
    let executable_path = find_pet_executable(app_handle);
    let executable_name = executable_path
        .as_ref()
        .and_then(|path| path.file_name())
        .and_then(|value| value.to_str())
        .map(ToOwned::to_owned);
    let running_process = find_running_pet_process(executable_name.as_deref());

    let available = executable_path.is_some();
    let running = running_process.is_some();
    let pid = running_process.as_ref().map(|(_, pid)| *pid);

    let message = if let Some(path) = &executable_path {
        if running {
            format!("已检测到桌宠进程正在运行：{}", path.display())
        } else {
            format!("已检测到可启动的桌宠程序：{}", path.display())
        }
    } else {
        "未找到可启动的 PyQt5 桌宠程序。请先打包桌宠，或确保 Manager 安装包已携带桌宠资源。".to_string()
    };

    ExternalPetAppStatus {
        available,
        running,
        executable_path: executable_path.map(|path| path.display().to_string()),
        executable_name,
        pid,
        message,
    }
}

#[tauri::command]
pub fn get_pet_app_status(app_handle: AppHandle) -> Result<ExternalPetAppStatus, String> {
    Ok(build_pet_app_status(Some(&app_handle)))
}

#[tauri::command]
pub fn launch_pet_app(app_handle: AppHandle) -> Result<ExternalPetAppStatus, String> {
    let status = build_pet_app_status(Some(&app_handle));
    if status.running {
        return Ok(status);
    }

    let executable_path = find_pet_executable(Some(&app_handle))
        .ok_or_else(|| "未找到可启动的 PyQt5 桌宠程序。".to_string())?;
    let executable_dir = executable_path
        .parent()
        .ok_or_else(|| "无法确定 PyQt5 桌宠程序所在目录。".to_string())?;

    #[cfg(target_os = "windows")]
    {
        spawn_hidden(Command::new(&executable_path).current_dir(executable_dir))
            .map_err(|error| error.to_string())?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        Command::new(&executable_path)
            .current_dir(executable_dir)
            .spawn()
            .map_err(|error| error.to_string())?;
    }

    thread::sleep(Duration::from_millis(450));
    Ok(build_pet_app_status(Some(&app_handle)))
}

#[tauri::command]
pub fn stop_pet_app(app_handle: AppHandle) -> Result<ExternalPetAppStatus, String> {
    let status = build_pet_app_status(Some(&app_handle));
    if !status.running {
        return Ok(status);
    }

    if let Some(pid) = status.pid {
        let output = run_output_hidden(Command::new("taskkill").args(["/PID", &pid.to_string(), "/T", "/F"]))
            .map_err(|error| error.to_string())?;

        if !output.status.success() {
            let detail = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if detail.is_empty() {
                "停止 PyQt5 桌宠程序失败。".to_string()
            } else {
                detail
            });
        }
    }

    thread::sleep(Duration::from_millis(450));
    Ok(build_pet_app_status(Some(&app_handle)))
}

#[tauri::command]
pub fn reveal_pet_app(app_handle: AppHandle) -> Result<(), String> {
    let executable_path = find_pet_executable(Some(&app_handle))
        .ok_or_else(|| "未找到可定位的 PyQt5 桌宠程序。".to_string())?;

    Command::new("explorer")
        .arg(format!("/select,{}", executable_path.display()))
        .spawn()
        .map_err(|error| error.to_string())?;

    Ok(())
}
