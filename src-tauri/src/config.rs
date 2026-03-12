use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_key: String,
    pub api_url: String,
    pub model: String,
    pub shortcut: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            api_key: String::new(),
            api_url: "https://api.openai.com/v1/chat/completions".to_string(),
            model: "gpt-4o-mini".to_string(),
            shortcut: "CmdOrCtrl+Shift+P".to_string(),
        }
    }
}

pub fn get_config(app_handle: &AppHandle) -> Result<AppConfig, String> {
    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;

    Ok(AppConfig {
        api_key: store
            .get("api_key")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_default(),
        api_url: store
            .get("api_url")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string()),
        model: store
            .get("model")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "gpt-4o-mini".to_string()),
        shortcut: store
            .get("shortcut")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "CmdOrCtrl+Shift+P".to_string()),
    })
}

pub fn save_config(app_handle: &AppHandle, cfg: &AppConfig) -> Result<(), String> {
    let store = app_handle.store("config.json").map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::json!(&cfg.api_key));
    store.set("api_url", serde_json::json!(&cfg.api_url));
    store.set("model", serde_json::json!(&cfg.model));
    store.set("shortcut", serde_json::json!(&cfg.shortcut));
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}
