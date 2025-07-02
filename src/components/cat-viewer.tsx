"use client";

import React, { useState, useEffect } from "react";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { KeyboardVisualization } from "./keyboard-visualization";
import NextImage from "next/image";
import { useLive2DSystem } from "@/hooks/use-live2d-system";

/**
 * 🎯 CatViewer - Live2D 渲染器组件
 *
 * 职责：
 * - Live2D 模型渲染和管理
 * - 背景图片显示和缩放同步
 * - 键盘可视化
 * - 设备事件处理
 */
export default function CatViewer() {
  // 🚀 统一的 Live2D 系统 - 所有 Live2D 逻辑在这里
  const { visible } = useLive2DSystem();
  const { backgroundImage, scale } = useCatStore();
  const { currentModel } = useModelStore();
  const [imageDimensions, setImageDimensions] = useState({
    width: 800,
    height: 600
  });

  // 🎯 判断当前模型是否需要背景和键盘交互
  const isInteractiveModel = currentModel?.id === "keyboard" || currentModel?.id === "standard";
  const shouldShowBackground = isInteractiveModel && backgroundImage;
  const shouldShowKeyboard = isInteractiveModel;

  // 获取图片实际尺寸
  useEffect(() => {
    if (backgroundImage) {
      const img = document.createElement("img");
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        console.log("📏 Background image dimensions:", {
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  // 🎯 计算缩放后的尺寸
  const scaledWidth = Math.round(imageDimensions.width * (scale / 100));
  const scaledHeight = Math.round(imageDimensions.height * (scale / 100));

  // 如果不可见，不渲染任何内容
  if (!visible) return null;

  return (
    <>
      {/* 🖼️ 背景图片层 - 仅对交互式模型显示 */}
      {shouldShowBackground && (
        <NextImage
          src={backgroundImage}
          alt="Background"
          width={scaledWidth}
          height={scaledHeight}
          className="absolute size-full"
          priority
        />
      )}

      {/* 🎭 Live2D Canvas - 所有模型都需要 */}
      <canvas id="live2dCanvas" className="absolute size-full" />

      {/* ⌨️ 键盘可视化层 - 仅对交互式模型显示 */}
      {shouldShowKeyboard && <KeyboardVisualization />}
    </>
  );
}
