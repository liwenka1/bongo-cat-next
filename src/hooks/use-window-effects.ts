import { useEffect, useCallback, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "sonner";
import { useCatStore } from "@/stores/cat-store";

/**
 * 🎯 窗口效果管理 Hook
 *
 * 职责：
 * - 监听窗口相关状态变化
 * - 调用 Tauri API 设置窗口属性
 * - 处理窗口穿透和始终置顶功能
 * - 防抖处理和错误恢复
 */
export function useWindowEffects() {
  const { penetrable, alwaysOnTop, visible, opacity, scale } = useCatStore();

  // 防止重复调用的标志
  const windowRef = useRef<ReturnType<typeof getCurrentWebviewWindow> | null>(null);
  const isInitializedRef = useRef(false);

  // 获取窗口实例（缓存）
  const getWindow = useCallback(() => {
    windowRef.current ??= getCurrentWebviewWindow();
    return windowRef.current;
  }, []);

  // 初始化窗口设置
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;

      // 设置初始的 alwaysOnTop 状态
      const initAlwaysOnTop = async () => {
        try {
          const window = getWindow();
          await window.setAlwaysOnTop(alwaysOnTop);
        } catch (error) {
          toast.error(`Failed to set window always on top: ${String(error)}`);
        }
      };

      void initAlwaysOnTop();
    }
  }, [alwaysOnTop, getWindow]);

  // 🎯 处理窗口穿透
  useEffect(() => {
    const applyPenetrable = async () => {
      try {
        const window = getWindow();
        await window.setIgnoreCursorEvents(penetrable);
      } catch (error) {
        toast.error(`Failed to set window click-through: ${String(error)}`);
      }
    };

    void applyPenetrable();
  }, [penetrable, getWindow]);

  // 🎯 处理始终置顶（跳过初始化时的重复调用）
  useEffect(() => {
    if (!isInitializedRef.current) return;

    const applyAlwaysOnTop = async () => {
      try {
        const window = getWindow();
        await window.setAlwaysOnTop(alwaysOnTop);
      } catch (error) {
        toast.error(`Failed to update window always on top: ${String(error)}`);
      }
    };

    void applyAlwaysOnTop();
  }, [alwaysOnTop, getWindow]);

  // 🎯 处理窗口显示/隐藏
  useEffect(() => {
    const applyVisibility = async () => {
      try {
        const window = getWindow();
        if (visible) {
          await window.show();
          await window.setFocus();
        } else {
          await window.hide();
        }
      } catch (error) {
        toast.error(`Failed to set window visibility: ${String(error)}`);
      }
    };

    void applyVisibility();
  }, [visible, getWindow]);

  // 🎯 处理窗口透明度（通过 CSS 变量实现）
  useEffect(() => {
    document.documentElement.style.setProperty("--window-opacity", (opacity / 100).toString());
  }, [opacity]);
}
