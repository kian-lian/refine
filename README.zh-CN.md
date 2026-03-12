# Refine

[English](./README.md)

一个 macOS 桌面应用，通过全局快捷键快速优化 AI Prompt。按下快捷键后，会在光标附近弹出浮动输入框，输入 prompt 后自动调用 AI 优化，并将结果粘贴回当前应用。

## 功能特性

- **全局快捷键** — 默认 `Cmd+Shift+P`，可自定义，在任意应用中唤起
- **光标定位浮窗** — 透明毛玻璃风格的悬浮输入框，自动定位到鼠标光标附近
- **AI Prompt 优化** — 调用 OpenAI 兼容 API，智能优化你的 prompt，保留原始意图
- **自动粘贴** — 优化完成后自动切回之前的应用并粘贴结果
- **可配置** — 支持自定义 API Key、API 地址、模型和快捷键

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | Tauri 2 |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS 4 |
| 后端 | Rust + Tokio |
| AI 接口 | OpenAI 兼容 API（默认 gpt-4o-mini） |

## 前置条件

- macOS（使用了 macOS 原生 API）
- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/)（或 Node.js）
- OpenAI 兼容的 API Key

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发环境
bun run tauri dev
```

首次启动后，点击输入框右侧的齿轮图标进入设置，配置你的 API Key。

## 构建

```bash
bun run tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。

## 使用方式

1. 启动应用后，应用会常驻后台
2. 在任意应用中按下 `Cmd+Shift+P`（或自定义快捷键）
3. 在弹出的输入框中输入你的 prompt
4. 按 `Enter` 发送，AI 会优化你的 prompt
5. 优化结果自动粘贴到之前的应用中
6. 按 `Escape` 可关闭浮窗

## 项目结构

```
src/                    # 前端（React + TypeScript）
├── App.tsx             # 主应用组件
├── components/
│   └── Settings.tsx    # 设置面板
└── main.tsx            # 入口

src-tauri/              # 后端（Rust）
├── src/
│   ├── lib.rs          # Tauri 命令与窗口管理
│   ├── ai.rs           # AI API 调用
│   ├── config.rs       # 配置持久化
│   └── paste.rs        # 剪贴板与粘贴模拟
├── Cargo.toml          # Rust 依赖
└── tauri.conf.json     # Tauri 配置
```

## 配置项

| 配置 | 说明 | 默认值 |
|------|------|--------|
| API Key | OpenAI 兼容的 API 密钥 | — |
| API URL | API 端点地址 | `https://api.openai.com/v1/chat/completions` |
| Model | 使用的模型 | `gpt-4o-mini` |
| Shortcut | 全局快捷键 | `Cmd+Shift+P` |

## 开发环境

推荐使用 [VS Code](https://code.visualstudio.com/) 并安装以下插件：

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
