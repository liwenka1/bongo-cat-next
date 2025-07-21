"use client";

import { useEffect, useCallback, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { PhysicalSize, LogicalSize } from "@tauri-apps/api/dpi";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { getImageSize } from "@/hooks/live2d/utils";
import type { Live2DInstance } from "@/types";
import { message } from "antd";

/**
 * 统一的窗口缩放和模型管理Hook
 *
 * 职责扩展：
 * 1. 监听scale变化 → 自动调整窗口尺寸
 * 2. 监听窗口拖拽 → 宽高比修正 + scale同步
 * 3. 监听模型变化 → 自动初始化模型位置
 * 4. 统一的模型重新定位和缩放逻辑
 */
export function useWindowScaling(
  live2dInstance: () => Live2DInstance | null, // Live2D实例获取器
  canvasRef?: React.RefObject<HTMLCanvasElement | null> // 画布引用（用于模型初始化）
) {
  const { scale, backgroundImage, setScale } = useCatStore();
  const { currentModel } = useModelStore();
  const isResizingRef = useRef(false); // 防止状态同步时的循环更新

  // 统一的模型初始化和位置设置函数
  const initializeModelPosition = useCallback(async () => {
    const live2d = live2dInstance();
    if (!live2d?.model || !backgroundImage) return;

    try {
      const { width, height } = await getImageSize(backgroundImage);
      const { innerWidth, innerHeight } = window;

      // 基于背景图计算基础缩放比例
      const scaleX = innerWidth / width;
      const scaleY = innerHeight / height;
      let optimalScale = Math.min(scaleX, scaleY);

      // 特殊处理：naximofu_2 模型需要额外缩放
      if (width === 612 && height === 612) {
        const naximofuBaseFactor = 612 / 13500;
        optimalScale = (naximofuBaseFactor * scale) / 100;
      }

      live2d.model.scale.set(optimalScale);
      live2d.model.x = innerWidth / 2;
      live2d.model.y = innerHeight / 2;
    } catch (error) {
      console.error(`Model initialization failed: ${String(error)}`);
    }
  }, [live2dInstance, backgroundImage, scale]);

  // 监听scale变化，自动调整窗口尺寸
  useEffect(() => {
    const handleScaleChange = async () => {
      if (!backgroundImage || isResizingRef.current) return;

      try {
        const { width, height } = await getImageSize(backgroundImage);
        const appWindow = getCurrentWebviewWindow();

        await appWindow.setSize(
          new PhysicalSize({
            width: Math.round(width * (scale / 100)),
            height: Math.round(height * (scale / 100))
          })
        );


        setTimeout(() => {
          void initializeModelPosition();
        }, 100);
      } catch (error) {
        message.error(`Scale change failed: ${String(error)}`);
      }
    };

    void handleScaleChange();
  }, [scale, backgroundImage, initializeModelPosition]);

  // 监听模型变化，自动初始化位置
  useEffect(() => {
    if (currentModel && backgroundImage && canvasRef?.current) {

      const timer = setTimeout(() => {
        void initializeModelPosition();
      }, 200);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentModel, backgroundImage, canvasRef, initializeModelPosition]);

  // 窗口resize处理
  const handleWindowResize = useCallback(async () => {
    if (!backgroundImage) return;

    const live2d = live2dInstance();
    if (!live2d?.model) {
      return;
    }

    try {
      isResizingRef.current = true;

      const { innerWidth, innerHeight } = window;
      const { width, height } = await getImageSize(backgroundImage);
      const scaleX = innerWidth / width;
      const scaleY = innerHeight / height;
      let optimalScale = Math.min(scaleX, scaleY);

      // 特殊处理：naximofu_2 模型需要额外缩放
      if (width === 612 && height === 612) {
        const naximofuBaseFactor = 612 / 13500;
        optimalScale = (naximofuBaseFactor * scale) / 100;
      }

      live2d.model.scale.set(optimalScale);
      live2d.model.x = innerWidth / 2;
      live2d.model.y = innerHeight / 2;
      const currentRatio = Math.round((innerWidth / innerHeight) * 10) / 10;
      const targetRatio = Math.round((width / height) * 10) / 10;

      if (currentRatio !== targetRatio) {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(
          new LogicalSize({
            width: innerWidth,
            height: Math.ceil(innerWidth * (height / width))
          })
        );


        setTimeout(() => {
          const newLive2d = live2dInstance();
          if (newLive2d?.model) {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            const newScaleX = newWidth / width;
            const newScaleY = newHeight / height;
            let newOptimalScale = Math.min(newScaleX, newScaleY);

            // 特殊处理：naximofu_2 模型需要额外缩放
            if (width === 612 && height === 612) {
              const naximofuBaseFactor = 612 / 13500;
              newOptimalScale = (naximofuBaseFactor * scale) / 100;
            }
            newLive2d.model.scale.set(newOptimalScale);
            newLive2d.model.x = newWidth / 2;
            newLive2d.model.y = newHeight / 2;
            newLive2d.resize();
          }
        }, 150);
      }


      setTimeout(() => {
        void (async () => {
          try {
            const size = await getCurrentWebviewWindow().size();
            const newScale = Math.round((size.width / width) * 100);
            if (Math.abs(newScale - scale) > 1) {
              setScale(newScale);
            }
          } catch (error) {
            message.error(`Scale sync failed: ${String(error)}`);
          } finally {
            isResizingRef.current = false;
          }
        })();
      }, 200);
    } catch (error) {
      message.error(`Window resize failed: ${String(error)}`);
      isResizingRef.current = false;
    }
  }, [backgroundImage, scale, setScale, live2dInstance]);


  useEffect(() => {
    const handleResize = () => {
      void handleWindowResize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleWindowResize]);
}
