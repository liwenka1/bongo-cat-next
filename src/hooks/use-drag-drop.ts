"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useModelStore } from "@/stores/model-store";
import { useI18n } from "@/hooks/use-i18n";
import { toast } from "sonner";
import { isTauriRuntime } from "@/utils/tauri";

/**
 * 🎯 拖放模型链接 Hook
 *
 * 监听来自 OS 文件管理器的拖放事件，支持直接将模型文件夹
 * 拖到应用窗口上来链接和切换模型。
 * 同时返回拖拽状态供 UI 层显示视觉反馈。
 */
export function useDragDrop() {
  const { t } = useI18n(["models"]);
  const { linkModel } = useModelStore();
  const unlistenRef = useRef<(() => void) | null>(null);

  // 🎯 拖拽视觉状态
  const [isDragging, setIsDragging] = useState(false);

  const resolveErrorMessage = useCallback(
    (result: { errorCode?: string; error?: string }) => {
      if (result.errorCode) {
        return t(`errors.${result.errorCode}`, {
          ns: "models",
          defaultValue: t("linkFailed", { ns: "models" })
        });
      }
      return result.error ?? t("linkFailed", { ns: "models" });
    },
    [t]
  );

  useEffect(() => {
    if (!isTauriRuntime()) return;

    const setup = async () => {
      try {
        const unlisten = await getCurrentWebviewWindow().onDragDropEvent(
          (event) => {
            void (async () => {
              const { type } = event.payload;

              switch (type) {
                case "over": {
                  setIsDragging(true);
                  break;
                }

                case "leave": {
                  setIsDragging(false);
                  break;
                }

                case "drop": {
                  setIsDragging(false);

                  const paths = event.payload.paths;
                  if (paths.length === 0) return;

                  const droppedPath = paths[0];
                  const result = await linkModel({ path: droppedPath });

                  if (result.cancelled) return;
                  if (result.success) {
                    toast.success(t("linkSuccess", { ns: "models" }));
                  } else {
                    toast.error(resolveErrorMessage(result));
                  }
                  break;
                }
              }
            })();
          }
        );

        unlistenRef.current = unlisten;
      } catch (error) {
        console.error("[useDragDrop] setup failed:", error);
      }
    };

    void setup();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [linkModel, resolveErrorMessage, t]);

  return { isDragging } as const;
}
