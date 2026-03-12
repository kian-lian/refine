import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type MouseEvent,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import {
  getCurrentWindow,
  LogicalSize,
  LogicalPosition,
} from "@tauri-apps/api/window";
import { GripVertical } from "lucide-react";
import "./App.css";
import { Settings } from "./components/Settings";
import { shouldStartWindowDrag } from "./lib/window-drag";

type Status = "idle" | "loading" | "success" | "error";

function App() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const appWindow = getCurrentWindow();

  // 调整窗口大小的辅助函数
  const resize = useCallback(
    (w: number, h: number) => appWindow.setSize(new LogicalSize(w, h)),
    [appWindow],
  );

  // 显示窗口
  const showWindow = useCallback(async () => {
    try {
      // 记录当前前台应用
      await invoke("prepare_show");

      // 获取鼠标位置定位窗口
      const [x, y] = await invoke<[number, number]>("get_cursor_position");

      // 将窗口定位在鼠标附近（稍微偏上）
      const windowWidth = 680;
      const windowHeight = 72;
      await appWindow.setPosition(
        new LogicalPosition(
          Math.max(0, Math.round(x - windowWidth / 2)),
          Math.max(0, Math.round(y - windowHeight - 20)),
        ),
      );

      await resize(windowWidth, windowHeight);
      await appWindow.show();
      await appWindow.setFocus();

      // 重置状态
      setInput("");
      setStatus("idle");
      setMessage("");
      setShowSettings(false);

      // 聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      console.error("显示窗口失败:", e);
    }
  }, [appWindow, resize]);

  // 隐藏窗口
  const hideWindow = useCallback(async () => {
    await appWindow.hide();
    setInput("");
    setStatus("idle");
    setMessage("");
  }, [appWindow]);

  // 注册全局快捷键
  useEffect(() => {
    const setupShortcut = async () => {
      try {
        let shortcut = "CmdOrCtrl+Shift+P";
        try {
          const config = await invoke<{
            api_key: string;
            api_url: string;
            model: string;
            shortcut: string;
          }>("get_config");
          if (config.shortcut) shortcut = config.shortcut;
        } catch {}

        await register(shortcut, (event) => {
          if (event.state === "Pressed") {
            showWindow();
          }
        });
      } catch (e) {
        console.error("注册快捷键失败:", e);
      }
    };

    setupShortcut();

    return () => {
      unregister("CmdOrCtrl+Shift+P").catch(() => {});
    };
  }, [showWindow]);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideWindow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hideWindow]);

  // 提交优化
  const handleSubmit = async () => {
    if (!input.trim() || status === "loading") return;

    setStatus("loading");
    setMessage("正在优化...");
    await resize(680, 120);

    try {
      const result = await invoke<string>("optimize_prompt", {
        prompt: input.trim(),
      });

      setStatus("success");
      setMessage("✓ 优化完成");

      // 自动粘贴
      try {
        const pasteMsg = await invoke<string>("paste_result", {
          text: result,
        });
        setMessage(`✓ ${pasteMsg}`);
      } catch {
        setMessage("✓ 已复制到剪贴板，请 ⌘V 粘贴");
      }

      // 短暂显示成功后自动关闭
      setTimeout(() => hideWindow(), 800);
    } catch (e) {
      setStatus("error");
      setMessage(typeof e === "string" ? e : "优化失败，请重试");
      await resize(680, 140);
    }
  };

  // 重试
  const handleRetry = () => {
    setStatus("idle");
    setMessage("");
    resize(680, 72);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleWindowMouseDown = useCallback(
    async (event: MouseEvent<HTMLElement>) => {
      if (event.button !== 0 || !shouldStartWindowDrag(event.target)) {
        return;
      }

      try {
        await appWindow.startDragging();
      } catch (e) {
        console.error("启动窗口拖拽失败:", e);
      }
    },
    [appWindow],
  );

  if (showSettings) {
    return (
      <Settings
        onClose={() => {
          setShowSettings(false);
          resize(680, 72);
        }}
      />
    );
  }

  return (
    <div className="w-full h-full" style={{ background: "transparent" }}>
      <div
        data-panel-shell="true"
        onMouseDown={handleWindowMouseDown}
        role="presentation"
        className="mx-auto overflow-hidden rounded-[34px]"
        style={{
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05)",
        }}
      >
        <div
          data-panel-glass="true"
          style={{
            background: "rgba(30, 30, 30, 0.95)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {/* 输入行 */}
          <div className="flex items-center px-5 h-[68px] gap-3">
            {/* Sparkle 图标 */}
            <div className="flex-none text-violet-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
              </svg>
            </div>

            {/* 输入框 */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  handleSubmit();
                }
              }}
              placeholder="输入你想优化的提示词，按回车发送..."
              disabled={status === "loading"}
              className="flex-1 bg-transparent text-white text-[15px] placeholder-white/30 outline-none disabled:opacity-50"
              autoFocus
            />

            {/* 状态/操作 */}
            <div className="flex-none flex items-center gap-2">
              {status === "loading" && (
                <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              )}
              <button
                type="button"
                data-window-drag-handle="true"
                onMouseDown={handleWindowMouseDown}
                aria-label="拖拽窗口"
                className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/5 hover:text-white/55 active:cursor-grabbing"
                title="拖拽窗口"
              >
                <GripVertical size={14} />
              </button>
              <button
                onClick={() => {
                  setShowSettings(true);
                  resize(680, 380);
                }}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="设置"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 0 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          {/* 状态消息 */}
          {message && (
            <div
              className={`px-5 pb-3 text-[13px] flex items-center gap-2 ${
                status === "error"
                  ? "text-red-400"
                  : status === "success"
                    ? "text-emerald-400"
                    : "text-white/50"
              }`}
            >
              <span className="truncate">{message}</span>
              {status === "error" && (
                <button
                  onClick={handleRetry}
                  className="flex-none text-violet-400 hover:text-violet-300 text-[12px] underline"
                >
                  重试
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
