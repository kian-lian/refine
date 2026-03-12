// cocoa crate 已标记废弃，推荐迁移到 objc2 系列，但目前 API 仍可正常使用
#![allow(deprecated)]

extern crate objc;

use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::StoreExt;

mod ai;
mod config;
mod paste;

pub use config::AppConfig;

/// 应用状态：存储上一个前台应用的 bundle identifier
pub struct AppState {
    pub previous_app_bundle_id: Mutex<Option<String>>,
}

/// 获取当前前台应用的 bundle id（用于粘贴后切回）
#[cfg(target_os = "macos")]
fn get_frontmost_app_bundle_id() -> Option<String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg("tell application \"System Events\" to get bundle identifier of first process whose frontmost is true")
        .output()
        .ok()?;
    let id = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if id.is_empty() { None } else { Some(id) }
}

/// 获取鼠标位置（用于弹窗定位）
#[tauri::command]
fn get_cursor_position() -> (f64, f64) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSScreen;
        use cocoa::base::nil;
        use cocoa::foundation::NSPoint;
        use objc::runtime::Object;

        unsafe {
            let mouse_location: NSPoint =
                cocoa::appkit::NSEvent::mouseLocation(nil as *mut Object);
            // macOS 坐标 y 轴从底部开始，转换为从顶部开始
            let screens = NSScreen::screens(nil);
            let primary_screen = cocoa::foundation::NSArray::objectAtIndex(screens, 0);
            let frame = NSScreen::frame(primary_screen);
            let y = frame.size.height - mouse_location.y;
            (mouse_location.x, y)
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        (0.0, 0.0)
    }
}

/// 记录当前前台应用，然后显示弹窗
#[tauri::command]
fn prepare_show(state: State<'_, AppState>) {
    let bundle_id = get_frontmost_app_bundle_id();
    *state.previous_app_bundle_id.lock().unwrap() = bundle_id;
}

/// 调用 AI 优化提示词
#[tauri::command]
async fn optimize_prompt(
    prompt: String,
    app_handle: AppHandle,
) -> Result<String, String> {
    let store = app_handle
        .store("config.json")
        .map_err(|e| e.to_string())?;

    let api_key = store
        .get("api_key")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();
    let api_url = store
        .get("api_url")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "https://api.openai.com/v1/chat/completions".to_string());
    let model = store
        .get("model")
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "gpt-4o-mini".to_string());

    if api_key.is_empty() {
        return Err("请先在设置中配置 API Key".to_string());
    }

    ai::call_ai(&api_url, &api_key, &model, &prompt).await
}

/// 将文本复制到剪贴板并自动粘贴到之前的应用
#[tauri::command]
async fn paste_result(text: String, state: State<'_, AppState>) -> Result<String, String> {
    // 1. 复制到剪贴板
    paste::copy_to_clipboard(&text)?;

    // 2. 获取之前的前台应用
    let bundle_id = state.previous_app_bundle_id.lock().unwrap().clone();

    // 3. 切换到之前的应用并模拟粘贴
    if let Some(bid) = bundle_id {
        paste::activate_and_paste(&bid).await?;
        Ok("已自动粘贴".to_string())
    } else {
        Ok("已复制到剪贴板，请手动粘贴 (⌘V)".to_string())
    }
}

/// 获取配置
#[tauri::command]
async fn get_config(app_handle: AppHandle) -> Result<config::AppConfig, String> {
    config::get_config(&app_handle)
}

/// 保存配置
#[tauri::command]
async fn save_config(cfg: config::AppConfig, app_handle: AppHandle) -> Result<(), String> {
    config::save_config(&app_handle, &cfg)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(AppState {
            previous_app_bundle_id: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            get_cursor_position,
            prepare_show,
            optimize_prompt,
            paste_result,
            get_config,
            save_config,
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.hide();

                // macOS: 强制窗口背景透明
                #[cfg(target_os = "macos")]
                {
                    use cocoa::appkit::{NSColor, NSWindow};
                    use cocoa::base::{id, nil};

                    unsafe {
                        let ns_win = window.ns_window().unwrap() as id;
                        let clear = NSColor::clearColor(nil);
                        ns_win.setBackgroundColor_(clear);
                        ns_win.setOpaque_(cocoa::base::NO);
                        ns_win.setHasShadow_(cocoa::base::NO);
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
