'use client'

import { useEffect, useCallback } from 'react'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'
import live2d from '@/utils/live2d'

export function useLive2D() {
  const { mousePosition, mousePressed, currentModel } = useModelStore()

  // 🚀 直接处理鼠标移动，就像原始项目
  const handleMouseMove = useCallback(() => {
    if (!live2d.model) return

    // TODO: 实现鼠标追踪逻辑，基于原始项目的 getCursorMonitor
    // 这里先简化实现
    const xRatio = mousePosition.x / window.innerWidth
    const yRatio = mousePosition.y / window.innerHeight

    for (const id of ['ParamMouseX', 'ParamMouseY', 'ParamAngleX', 'ParamAngleY']) {
      const { min, max } = live2d.getParameterRange(id)
      if (min === undefined || max === undefined) continue

      const isXAxis = id.endsWith('X')
      const ratio = isXAxis ? xRatio : yRatio
      const value = max - (ratio * (max - min))

      live2d.setParameterValue(id, value)
    }
  }, [mousePosition.x, mousePosition.y])

  // 🚀 直接处理鼠标按下，就像原始项目
  const handleMouseDown = useCallback((pressedButtons: string[]) => {
    if (!live2d.model) return

    const params = {
      ParamMouseLeftDown: pressedButtons.includes('Left'),
      ParamMouseRightDown: pressedButtons.includes('Right'),
    }

    for (const [id, pressed] of Object.entries(params)) {
      const { min, max } = live2d.getParameterRange(id)
      if (min === undefined || max === undefined) continue

      live2d.setParameterValue(id, pressed ? max : min)
    }
  }, [])

  // 🚀 直接处理键盘按下，就像原始项目
  const handleKeyDown = useCallback((side: 'left' | 'right', pressed: boolean) => {
    if (!live2d.model) return

    const id = side === 'left' ? 'CatParamLeftHandDown' : 'CatParamRightHandDown'
    const { min, max } = live2d.getParameterRange(id)
    if (min === undefined || max === undefined) return

    live2d.setParameterValue(id, pressed ? max : min)
  }, [])

  // 处理窗口大小调整
  const handleResize = useCallback(() => {
    if (live2d.app) {
      live2d.app.resize()
    }
  }, [])

  // 加载模型
  useEffect(() => {
    if (currentModel) {
      const loadModel = async () => {
        try {
          await live2d.load(currentModel.path)
          console.log('✅ Live2D model loaded successfully')
        } catch (error) {
          console.error('❌ Live2D model loading failed:', error)
        }
      }
      void loadModel()
    }
  }, [currentModel])

  return {
    handleResize,
    handleMouseDown,
    handleMouseMove,
    handleKeyDown,
  }
} 