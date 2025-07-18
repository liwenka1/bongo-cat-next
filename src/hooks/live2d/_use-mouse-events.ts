import { useCallback, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import type { DeviceEvent, Live2DInstance } from "@/types";

/**
 * 鼠标事件处理
 * 处理鼠标移动、点击事件并更新 Live2D 参数
 */
export function _useMouseEvents(initializeLive2D: () => Promise<Live2DInstance | null>) {
  const unlistenRef = useRef<(() => void) | null>(null);

  // 鼠标事件处理
  const setupMouseEvents = useCallback(async () => {
    const live2d = await initializeLive2D();
    if (!live2d) return;

    try {
      const unlisten = await listen<DeviceEvent>("device-changed", ({ payload }) => {
        const { kind, value } = payload;

        if (!live2d.model) return;

        switch (kind) {
          case "MouseMove": {
            if (value && typeof value === "object" && "x" in value && "y" in value) {
              const mousePos = value as { x: number; y: number };
              const xRatio = mousePos.x / window.screen.width;
              const yRatio = mousePos.y / window.screen.height;

              // 鼠标追踪参数
              for (const id of ["ParamMouseX", "ParamMouseY", "ParamAngleX", "ParamAngleY"]) {
                const { min, max } = live2d.getParameterRange(id);
                if (min === undefined || max === undefined) continue;

                const isXAxis = id.endsWith("X");
                const ratio = isXAxis ? xRatio : yRatio;
                const paramValue = max - ratio * (max - min);

                live2d.setParameterValue(id, paramValue);
              }
            }
            break;
          }
          case "MousePress": {
            if (typeof value === "string") {
              const paramMap = {
                Left: "ParamMouseLeftDown",
                Right: "ParamMouseRightDown"
              } as const;

              const paramId = paramMap[value as keyof typeof paramMap];
              // paramId 来自 const 断言，总是存在的
              const { min, max } = live2d.getParameterRange(paramId);
              if (min !== undefined && max !== undefined) {
                live2d.setParameterValue(paramId, max);
              }
            }
            break;
          }
          case "MouseRelease": {
            if (typeof value === "string") {
              const paramMap = {
                Left: "ParamMouseLeftDown",
                Right: "ParamMouseRightDown"
              } as const;

              const paramId = paramMap[value as keyof typeof paramMap];
              // paramId 来自 const 断言，总是存在的
              const { min, max } = live2d.getParameterRange(paramId);
              if (min !== undefined && max !== undefined) {
                live2d.setParameterValue(paramId, min);
              }
            }
            break;
          }
        }
      });

      unlistenRef.current = unlisten;
      console.log("✅ Mouse event listener established");
    } catch (error) {
      console.error("❌ Failed to setup mouse listener:", error);
    }
  }, [initializeLive2D]);

  // 清理事件监听器
  const cleanup = useCallback(() => {
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
  }, []);

  return {
    setupMouseEvents,
    cleanup
  };
}
