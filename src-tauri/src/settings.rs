use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::{AppHandle, Manager};

/// Mirrors the TS settings shape; serialized camelCase for the renderer.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub work_minutes: u32,
    pub break_limit: u32,
    pub theme: Theme,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Dark,
    Light,
}

pub const DEFAULT: Settings = Settings {
    work_minutes: 25,
    break_limit: 10,
    theme: Theme::Dark,
};

/// Owns the settings file plus an in-memory copy of the last known values.
/// The ticker reads from the cache, so its hot path never touches the disk.
pub struct SettingsStore {
    path: PathBuf,
    current: Mutex<Settings>,
}

impl SettingsStore {
    pub fn new(app: &AppHandle) -> Self {
        let path = settings_file(app);
        let current = load_from(&path);
        Self {
            path,
            current: Mutex::new(current),
        }
    }

    pub fn get(&self) -> Settings {
        *self.current.lock().unwrap()
    }

    pub fn save(&self, settings: Settings) {
        let validated = validate(settings);
        save_to(&self.path, validated);
        *self.current.lock().unwrap() = validated;
    }
}

fn settings_file(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    dir.join("settings.json")
}

/// Reads persisted settings. Falls back to defaults on any read or parse
/// error, like the Electron store did. Only `"light"` means light; anything
/// else means dark.
fn load_from(path: &Path) -> Settings {
    let Ok(raw) = fs::read_to_string(path) else {
        return DEFAULT;
    };
    let Ok(value) = serde_json::from_str::<Value>(&raw) else {
        return DEFAULT;
    };
    Settings {
        work_minutes: value
            .get("workMinutes")
            .and_then(Value::as_u64)
            .and_then(|value| u32::try_from(value).ok())
            .unwrap_or(DEFAULT.work_minutes),
        break_limit: value
            .get("breakLimit")
            .and_then(Value::as_u64)
            .and_then(|value| u32::try_from(value).ok())
            .unwrap_or(DEFAULT.break_limit),
        theme: match value.get("theme").and_then(Value::as_str) {
            Some("light") => Theme::Light,
            _ => Theme::Dark,
        },
    }
}

/// Clamps to the ranges the UI enforces, so hand-edited files or malformed
/// IPC payloads can never produce an out-of-range session.
fn validate(settings: Settings) -> Settings {
    Settings {
        work_minutes: settings.work_minutes.clamp(5, 90),
        break_limit: settings.break_limit.clamp(1, 20),
        theme: settings.theme,
    }
}

fn save_to(path: &Path, settings: Settings) {
    if let Some(dir) = path.parent() {
        let _ = fs::create_dir_all(dir);
    }
    if let Ok(json) = serde_json::to_string_pretty(&settings) {
        let _ = fs::write(path, json);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_path(name: &str) -> PathBuf {
        let path = std::env::temp_dir().join(format!("pxmer-settings-{name}.json"));
        let _ = fs::remove_file(&path);
        path
    }

    #[test]
    fn missing_file_falls_back_to_defaults() {
        let path = temp_path("missing");
        assert_eq!(load_from(&path), DEFAULT);
    }

    #[test]
    fn broken_json_falls_back_to_defaults() {
        let path = temp_path("broken");
        fs::write(&path, "{ not json").unwrap();
        assert_eq!(load_from(&path), DEFAULT);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn partial_settings_fill_in_defaults() {
        let path = temp_path("partial");
        fs::write(&path, r#"{ "theme": "light" }"#).unwrap();
        assert_eq!(
            load_from(&path),
            Settings {
                work_minutes: DEFAULT.work_minutes,
                break_limit: DEFAULT.break_limit,
                theme: Theme::Light,
            }
        );
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn unknown_theme_means_dark() {
        let path = temp_path("theme");
        fs::write(&path, r#"{ "theme": "neon" }"#).unwrap();
        assert_eq!(load_from(&path).theme, Theme::Dark);
        let _ = fs::remove_file(&path);
    }

    #[test]
    fn validate_clamps_to_ui_ranges() {
        assert_eq!(
            validate(Settings {
                work_minutes: 1,
                break_limit: 99,
                theme: Theme::Light,
            }),
            Settings {
                work_minutes: 5,
                break_limit: 20,
                theme: Theme::Light,
            }
        );
    }

    #[test]
    fn save_then_load_roundtrips_validated_values() {
        let path = temp_path("roundtrip");
        save_to(
            &path,
            validate(Settings {
                work_minutes: 120,
                break_limit: 3,
                theme: Theme::Light,
            }),
        );
        assert_eq!(
            load_from(&path),
            Settings {
                work_minutes: 90,
                break_limit: 3,
                theme: Theme::Light,
            }
        );
        let _ = fs::remove_file(&path);
    }
}
