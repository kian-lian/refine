import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { GripVertical } from "lucide-react";
import { shouldStartWindowDrag } from "../lib/window-drag";

interface Config {
  api_key: string;
  api_url: string;
  model: string;
  shortcut: string;
}

export function Settings({ onClose }: { onClose: () => void }) {
  const appWindow = getCurrentWindow();
  const [config, setConfig] = useState<Config>({
    api_key: "",
    api_url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    shortcut: "CmdOrCtrl+Shift+P",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoke<Config>("get_config").then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await invoke("save_config", { cfg: config });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 600);
    } catch (e) {
      console.error("保存失败:", e);
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:border-violet-400/50 placeholder-white/25 transition-colors";
  const labelClass = "block text-white/50 text-[12px] mb-1.5";

  const handleTitleMouseDown = useCallback(
    async (event: MouseEvent<HTMLElement>) => {
      if (event.button !== 0 || !shouldStartWindowDrag(event.target)) {
        return;
      }

      try {
        await appWindow.startDragging();
      } catch (e) {
        console.error("启动设置窗口拖拽失败:", e);
      }
    },
    [appWindow],
  );

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow:
          "0 24px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05)",
      }}
    >
      {/* 标题栏 */}
      <div
        onMouseDown={handleTitleMouseDown}
        role="presentation"
        className="flex cursor-grab items-center justify-between px-5 pt-4 pb-3 active:cursor-grabbing"
      >
        <div
          data-window-drag-handle="true"
          className="flex items-center gap-2 text-white/70"
        >
          <GripVertical size={14} className="text-white/20" />
          <span className="text-[14px] font-medium">设置</span>
        </div>
        <button
          data-no-window-drag="true"
          onClick={onClose}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 表单 */}
      <div className="px-5 pb-5 space-y-3">
        <div>
          <label className={labelClass}>API Key</label>
          <input
            type="password"
            value={config.api_key}
            onChange={(e) =>
              setConfig({ ...config, api_key: e.target.value })
            }
            placeholder="sk-..."
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass}>API 地址</label>
          <input
            value={config.api_url}
            onChange={(e) =>
              setConfig({ ...config, api_url: e.target.value })
            }
            placeholder="https://api.openai.com/v1/chat/completions"
            className={fieldClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>模型</label>
            <input
              value={config.model}
              onChange={(e) =>
                setConfig({ ...config, model: e.target.value })
              }
              placeholder="gpt-4o-mini"
              className={fieldClass}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>快捷键</label>
            <input
              value={config.shortcut}
              onChange={(e) =>
                setConfig({ ...config, shortcut: e.target.value })
              }
              placeholder="CmdOrCtrl+Shift+P"
              className={fieldClass}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-[13px] font-medium rounded-lg py-2 transition-colors"
        >
          {saved ? "✓ 已保存" : saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
