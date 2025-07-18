import { useCallback } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@/utils/path";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { PhysicalSize } from "@tauri-apps/api/dpi";
import { getImageSize } from "./utils";
import type { Live2DInstance } from "@/types";
import type { Model } from "@/stores/model-store";

/**
 * 缩放处理逻辑
 * 处理窗口和模型的缩放逻辑
 */
export function _useScaling(initializeLive2D: () => Promise<Live2DInstance | null>, isLoading: () => boolean) {
  // 窗口大小调整逻辑
  const handleScaleChange = useCallback(
    async (scale: number, currentModel: Model | null) => {
      if (typeof window === "undefined" || !currentModel) return;

      try {
        const live2d = await initializeLive2D();
        if (!live2d) return;

        console.log("🎚️ Handling scale change:", {
          scale,
          currentModel: currentModel.name
        });

        // 获取背景图片
        const bgPath = join(currentModel.path, "resources", "background.png");
        const bgUrl = convertFileSrc(bgPath);

        // 获取背景图片的原始尺寸
        const { width, height } = await getImageSize(bgUrl);
        console.log("📏 Background image size:", { width, height, scale });

        // 缩放计算方式 - scale 现在是百分比（如 50, 100, 150）
        const scaleRatio = scale / 100;
        const newWidth = Math.round(width * scaleRatio);
        const newHeight = Math.round(height * scaleRatio);

        // 设置窗口大小（这会触发Live2D Canvas的自动调整）
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(
          new PhysicalSize({
            width: newWidth,
            height: newHeight
          })
        );

        // 统一缩放逻辑：先调整窗口大小，然后统一处理缩放
        // Live2D模型会根据新的窗口尺寸自动调整
        setTimeout(() => {
          live2d.resize();
          // 使用统一的缩放逻辑
          live2d.setUserScale(scaleRatio);
          console.log("✅ Live2D user scale updated with unified logic:", scaleRatio);
        }, 100); // 给窗口调整一点时间

        console.log("✅ Window and model scaled:", {
          newWidth,
          newHeight,
          scale
        });
      } catch (error) {
        console.error("❌ Failed to handle scale change:", error);
      }
    },
    [initializeLive2D]
  );

  // 缩放逻辑
  const handleResize = useCallback(
    async (scale: number, currentModel: Model | null) => {
      // 关键修复：如果模型正在加载，则直接跳过，防止竞态条件
      if (isLoading()) {
        console.log("⏳ Model is loading, skipping resize for now.");
        return;
      }

      try {
        const live2d = await initializeLive2D();

        // 关键修复：添加卫兵，确保模型已加载
        if (!live2d || !live2d.model || !currentModel) {
          console.warn("⚠️ handleResize skipped, model not ready yet.");
          return;
        }

        // 获取当前窗口尺寸
        const { innerWidth, innerHeight } = window;

        // 获取背景图片尺寸
        const bgPath = join(currentModel.path, "resources", "background.png");
        const bgUrl = convertFileSrc(bgPath);
        const { width, height } = await getImageSize(bgUrl);

        // 统一缩放逻辑：使用 applyUserScale 方法来保持一致性
        // 移除直接的 model.scale.set 调用，改为使用统一的缩放方法
        live2d.model.scale.set(innerWidth / width);

        // 使用统一的缩放逻辑
        const currentUserScale = scale / 100;
        live2d.setUserScale(currentUserScale);

        console.log("✅ Live2D resize completed (unified scaling):", {
          innerWidth,
          innerHeight,
          userScale: currentUserScale
        });
      } catch (error) {
        console.error("❌ Failed to resize:", error);
      }
    },
    [initializeLive2D, isLoading]
  );

  // 重新调整模型（简化版，主要用于Live2D Canvas的resize）
  const resizeModel = useCallback(async () => {
    const live2d = await initializeLive2D();
    live2d?.resize();
  }, [initializeLive2D]);

  return {
    handleScaleChange,
    handleResize,
    resizeModel
  };
}
