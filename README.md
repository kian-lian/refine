# Refine

[中文文档](./README.zh-CN.md)

A macOS desktop app that optimizes AI prompts via a global hotkey. Press the shortcut to summon a floating input near your cursor, type your prompt, and get an AI-optimized version automatically pasted back into your active app.

## Features

- **Global Hotkey** — Default `Cmd+Shift+P`, customizable, works across all apps
- **Cursor-positioned Overlay** — Transparent glassmorphism floating input, auto-positioned near your mouse cursor
- **AI Prompt Optimization** — Calls OpenAI-compatible API to intelligently refine your prompt while preserving intent
- **Auto Paste** — Automatically switches back to the previous app and pastes the result
- **Configurable** — Custom API Key, API endpoint, model, and shortcut

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri 2 |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 |
| Backend | Rust + Tokio |
| AI API | OpenAI-compatible (default: gpt-4o-mini) |

## Prerequisites

- macOS (uses native macOS APIs)
- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/) (or Node.js)
- An OpenAI-compatible API Key

## Quick Start

```bash
# Install dependencies
bun install

# Start development
bun run tauri dev
```

On first launch, click the gear icon on the right side of the input to open Settings and configure your API Key.

## Build

```bash
bun run tauri build
```

Build artifacts are located in `src-tauri/target/release/bundle/`.

## Usage

1. Launch the app — it runs in the background
2. Press `Cmd+Shift+P` (or your custom shortcut) in any app
3. Type your prompt in the floating input
4. Press `Enter` to submit — AI will optimize your prompt
5. The optimized result is automatically pasted into the previous app
6. Press `Escape` to dismiss the overlay

## Project Structure

```
src/                    # Frontend (React + TypeScript)
├── App.tsx             # Main application component
├── components/
│   └── Settings.tsx    # Settings panel
└── main.tsx            # Entry point

src-tauri/              # Backend (Rust)
├── src/
│   ├── lib.rs          # Tauri commands & window management
│   ├── ai.rs           # AI API integration
│   ├── config.rs       # Persistent configuration
│   └── paste.rs        # Clipboard & paste simulation
├── Cargo.toml          # Rust dependencies
└── tauri.conf.json     # Tauri configuration
```

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| API Key | OpenAI-compatible API key | — |
| API URL | API endpoint | `https://api.openai.com/v1/chat/completions` |
| Model | Model to use | `gpt-4o-mini` |
| Shortcut | Global hotkey | `Cmd+Shift+P` |

## Development

Recommended IDE: [VS Code](https://code.visualstudio.com/) with the following extensions:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT
