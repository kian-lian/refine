# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Refine is a macOS desktop app (Tauri v2 + React 19 + TypeScript) that optimizes user prompts via LLM. Activated by a global hotkey, it shows a floating transparent panel at cursor position, sends the prompt to an OpenAI-compatible API, and auto-pastes the optimized result back into the previous application.

## Build & Dev Commands

```bash
bun run tauri dev      # Full-stack dev with hot reload (frontend + Rust backend)
bun run tauri build    # Production build (creates .app bundle)
bun run dev            # Frontend-only dev server (port 1420)
bun run build          # Frontend build (tsc + vite)
```

Package manager is **bun** (not npm/yarn).

## Architecture

### Frontend (`src/`)
- **App.tsx** — Single main component handling the prompt input UI, window lifecycle (show/hide/position), and IPC calls to Rust backend
- **components/Settings.tsx** — Settings panel for API key, URL, model, shortcut; persists via `@tauri-apps/plugin-store`
- **Styling** — Tailwind CSS 4 with Geist font, glassmorphic dark theme, transparent window background

### Backend (`src-tauri/src/`)
- **lib.rs** — Tauri setup, IPC command registration, window management. Stores `previous_app_bundle_id` in AppState for app-switching
- **ai.rs** — OpenAI-compatible API calls via `reqwest`. System prompt for prompt optimization, temperature 0.3
- **config.rs** — `AppConfig` struct (api_key, api_url, model, shortcut) with Tauri Store persistence
- **paste.rs** — macOS-specific: clipboard via `pbcopy`, app activation + Cmd+V paste via AppleScript

### IPC Commands (Tauri invoke)
- `get_cursor_position` — Native mouse position (macOS `NSEvent`)
- `prepare_show` — Saves current foreground app's bundle ID
- `optimize_prompt(prompt)` — Calls LLM API, returns optimized text
- `paste_result(text)` — Copies to clipboard, switches to previous app, pastes
- `get_config` / `save_config` — Config persistence

### App Flow
Global hotkey → show floating window at cursor → user enters prompt → Rust calls LLM API → result copied + pasted into previous app → window hides

## Key Details

- Window: 680x72px, transparent, borderless, always-on-top, no taskbar entry
- Uses Tauri v2 `macos-private-api` feature for window transparency
- macOS-only system integration (AppleScript for paste, NSEvent for cursor, Cocoa for window)
- Path alias: `@/*` maps to `./src/*`
- Rust edition 2021, async via tokio
