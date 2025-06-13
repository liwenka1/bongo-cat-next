'use client'

import React, { useEffect, useRef } from 'react'
import { useCatStore } from '@/stores/catStore'
import { useModel } from '@/hooks/useModel'
import { useDevice } from '@/hooks/useDevice'
import { KeyboardVisualization } from './KeyboardVisualization'

export default function CatViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { 
    visible, 
    opacity, 
    scale, 
    mirrorMode,
    currentModelPath 
  } = useCatStore()
  
  const {
    backgroundImage,
    isLoading,
    error,
    isClient,
    handleLoad,
    handleDestroy,
    handleResize
  } = useModel()

  // 启用设备事件监听
  useDevice()

  // 初始化Live2D
  useEffect(() => {
    if (isClient && currentModelPath) {
              handleLoad().catch((err) => { console.error(err) })
    }

    return () => {
      handleDestroy()
    }
  }, [isClient, currentModelPath, handleLoad, handleDestroy])

  // 处理窗口大小变化
  useEffect(() => {
    const handleWindowResize = () => {
      handleResize()
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleResize])

  if (!visible) return null

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        opacity: opacity / 100,
        transform: `scale(${scale}) ${mirrorMode ? 'scaleX(-1)' : ''}`,
        transformOrigin: 'center bottom'
      }}
    >
      {/* 背景图片 */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            console.warn('Background image failed to load:', backgroundImage)
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      
      {/* Live2D Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      />
      
      {/* 键盘可视化 */}
      <KeyboardVisualization />
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-lg">Loading model...</div>
        </div>
      )}
      
      {/* 错误状态 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-50">
          <div className="text-white text-lg">Error: {error}</div>
        </div>
      )}
      
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 p-2 rounded pointer-events-none">
          <div>Model: {currentModelPath}</div>
          <div>Scale: {scale}</div>
          <div>Mirror: {mirrorMode ? 'On' : 'Off'}</div>
          <div>Client: {isClient ? 'Ready' : 'Loading'}</div>
        </div>
      )}
    </div>
  )
} 