use std::process::Command;

/// 复制文本到系统剪贴板
pub fn copy_to_clipboard(text: &str) -> Result<(), String> {
    // 使用 pbcopy（macOS 自带命令）确保可靠写入
    let mut child = Command::new("pbcopy")
        .stdin(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("无法启动 pbcopy: {}", e))?;

    use std::io::Write;
    child
        .stdin
        .as_mut()
        .ok_or("无法获取 stdin")?
        .write_all(text.as_bytes())
        .map_err(|e| format!("写入剪贴板失败: {}", e))?;

    child
        .wait()
        .map_err(|e| format!("pbcopy 执行失败: {}", e))?;

    Ok(())
}

/// 激活之前的应用并模拟 Cmd+V 粘贴
pub async fn activate_and_paste(bundle_id: &str) -> Result<(), String> {
    // 使用 AppleScript 激活之前的应用
    let activate_script = format!(
        r#"tell application id "{}" to activate"#,
        bundle_id
    );

    Command::new("osascript")
        .arg("-e")
        .arg(&activate_script)
        .output()
        .map_err(|e| format!("激活应用失败: {}", e))?;

    // 等待应用获得焦点
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    // 使用 AppleScript 模拟 Cmd+V 粘贴
    // 这比 CGEvent 更可靠，不需要额外权限配置
    let paste_script = r#"tell application "System Events" to keystroke "v" using command down"#;

    let output = Command::new("osascript")
        .arg("-e")
        .arg(paste_script)
        .output()
        .map_err(|e| format!("模拟粘贴失败: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // 如果 AppleScript 失败（通常是权限问题），降级提示
        return Err(format!(
            "自动粘贴失败（需要辅助功能权限），已复制到剪贴板，请手动 ⌘V 粘贴。错误: {}",
            stderr
        ));
    }

    Ok(())
}
