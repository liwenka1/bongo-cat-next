"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCatStore } from "@/stores/cat-store";
import { isInteractiveModelMode, useModelStore } from "@/stores/model-store";
import { KeyboardVisualization } from "./keyboard-visualization";
import NextImage from "next/image";
import { useLive2DSystem } from "@/hooks/use-live2d-system";
import { MotionSelector } from "@/components/motion-selector";
import { ExpressionSelector } from "@/components/expression-selector";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useLive2DSystem(canvasRef);
  const { currentModel } = useModelStore();

  // 从 store 中获取状态
  const { backgroundImage, scale, availableMotions, availableExpressions, selectorsVisible } = useCatStore();

  const [imageDimensions, setImageDimensions] = useState({
    width: 800,
    height: 600
  });

  // 🎯 判断当前模型是否启用背景/键盘等交互能力
  const isInteractiveModel = currentModel ? isInteractiveModelMode(currentModel.mode) : false;
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
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  // 🎯 计算缩放后的尺寸
  const scaledWidth = Math.round(imageDimensions.width * (scale / 100));
  const scaledHeight = Math.round(imageDimensions.height * (scale / 100));

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
      <canvas ref={canvasRef} id="live2dCanvas" className="absolute size-full" />

      {/* ⌨️ 键盘可视化层 - 仅对交互式模型显示 */}
      {shouldShowKeyboard && <KeyboardVisualization />}
    </>
  );
}
