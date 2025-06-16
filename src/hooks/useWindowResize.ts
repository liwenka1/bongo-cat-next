'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { LogicalSize, PhysicalSize } from '@tauri-apps/api/dpi'
import { convertFileSrc } from '@tauri-apps/api/core'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'
import { join } from '@/utils/path'

// 获取图片尺寸的工具函数
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = reject
    img.src = src
  })
}

export function useWindowResize() {
  const [isResizing, setIsResizing] = useState(false)
  const { scale, setScale } = useCatStore()
  const { currentModel } = useModelStore()
  const lastScaleRef = useRef(scale)

  const resizeWindow = useCallback(async (newScale: number) => {
    if (!currentModel || typeof window === 'undefined') return

    setIsResizing(true)

    try {
      const appWindow = getCurrentWebviewWindow()
      
      // 获取背景图片尺寸
      const backgroundImagePath = join(currentModel.path, 'resources', 'background.png')
      const backgroundImageUrl = convertFileSrc(backgroundImagePath)
      const { width, height } = await getImageSize(backgroundImageUrl)

      // 计算新的窗口尺寸
      const newWidth = Math.round(width * (newScale / 100))
      const newHeight = Math.round(height * (newScale / 100))

      // 设置窗口大小
      await appWindow.setSize(new PhysicalSize({
        width: newWidth,
        height: newHeight,
      }))

      // 更新 scale 状态
      setScale(newScale / 100)

      console.log(`Window resized to ${newWidth}x${newHeight} (scale: ${newScale}%)`)
    } catch (error) {
      console.error('Failed to resize window:', error)
    } finally {
      // 延迟关闭重绘状态，给用户视觉反馈
      setTimeout(() => {
        setIsResizing(false)
      }, 200)
    }
  }, [currentModel, setScale])

  const handleAutoResize = useCallback(async () => {
    if (!currentModel || typeof window === 'undefined') return

    try {
      const appWindow = getCurrentWebviewWindow()
      const { innerWidth, innerHeight } = window
      
      // 获取背景图片尺寸
      const backgroundImagePath = join(currentModel.path, 'resources', 'background.png')
      const backgroundImageUrl = convertFileSrc(backgroundImagePath)
      const { width, height } = await getImageSize(backgroundImageUrl)

      // 计算当前窗口与背景图片的比例
      const currentScale = Math.round((innerWidth / width) * 100)
      
      // 如果比例不匹配，调整窗口
      if (Math.round(innerWidth / innerHeight * 10) !== Math.round(width / height * 10)) {
        await appWindow.setSize(new LogicalSize({
          width: innerWidth,
          height: Math.ceil(innerWidth * (height / width)),
        }))
      }

      // 获取实际窗口大小并更新 scale
      const actualSize = await appWindow.innerSize()
      const actualScale = (actualSize.width / width) * 100
      
      setScale(actualScale / 100)
    } catch (error) {
      console.error('Failed to auto resize:', error)
    }
  }, [currentModel, setScale])

  // 监听 scale 变化并调整窗口大小
  useEffect(() => {
    const currentScale = Math.round(scale * 100)
    const lastScale = Math.round(lastScaleRef.current * 100)
    
    if (currentScale !== lastScale) {
      lastScaleRef.current = scale
      void resizeWindow(currentScale)
    }
  }, [scale, resizeWindow])

  return {
    isResizing,
    resizeWindow,
    handleAutoResize,
  }
} 