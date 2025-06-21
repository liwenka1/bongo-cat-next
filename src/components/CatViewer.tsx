"use client";

import React, { useState, useEffect } from "react";
import { useLive2DSystem } from "@/hooks/useLive2DSystem";
import { useCatStore } from "@/stores/catStore";
import { KeyboardVisualization } from "./KeyboardVisualization";
import NextImage from "next/image";

/**
 * 🎯 CatViewer - Live2D 渲染器组件
 *
 * 职责：
 * - Live2D 模型渲染和管理
 * - 背景图片显示
 * - 键盘可视化
 * - 设备事件处理
 */
export default function CatViewer() {
  // 🚀 统一的 Live2D 系统 - 所有 Live2D 逻辑在这里
  const { visible } = useLive2DSystem();
  const { backgroundImage } = useCatStore();
  const [imageDimensions, setImageDimensions] = useState({ width: 800, height: 600 });

  // 获取图片实际尺寸
  useEffect(() => {
    if (backgroundImage) {
      const img = document.createElement('img');
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
        console.log('📏 Background image dimensions:', { 
          width: img.naturalWidth, 
          height: img.naturalHeight 
        });
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  // 如果不可见，不渲染任何内容
  if (!visible) return null;

  return (
    <>
      {/* 🖼️ 背景图片层 - z-index: 1 */}
      {backgroundImage && (
        <NextImage
          src={backgroundImage}
          alt="Background"
          fill
          className="absolute size-full"
          priority
        />
      )}

      {/* 🎭 Live2D Canvas - 核心渲染区域 - z-index: 2 */}
      <canvas
        id="live2dCanvas"
        className="absolute size-full"
        style={{ zIndex: 2 }}
      />

      {/* ⌨️ 键盘可视化层 - z-index: 3 */}
      <KeyboardVisualization />
    </>
  );
}
