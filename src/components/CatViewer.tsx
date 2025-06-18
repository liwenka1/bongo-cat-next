'use client'

import React from 'react'
import { useLive2DSystem } from '@/hooks/useLive2DSystem'
import { useCatStore } from '@/stores/catStore'
import { KeyboardVisualization } from './KeyboardVisualization'
import Image from 'next/image'

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
  const { visible, opacity, scale, mirrorMode } = useLive2DSystem()
  const { backgroundImage } = useCatStore()

  // 如果不可见，不渲染任何内容
  if (!visible) return null

  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{
        opacity: opacity / 100,
        transform: `scale(${scale}) ${mirrorMode ? 'scaleX(-1)' : ''}`,
        transformOrigin: 'center bottom'
      }}
    >
      {/* 🖼️ 背景图片 */}
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover pointer-events-none"
          priority
          onError={(e) => {
            console.warn('Background image failed to load:', backgroundImage)
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      
      {/* 🎭 Live2D Canvas - 核心渲染区域 */}
      <canvas
        id="live2dCanvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      />
      
      {/* ⌨️ 键盘可视化层 */}
      <KeyboardVisualization />
    </div>
  )
} 