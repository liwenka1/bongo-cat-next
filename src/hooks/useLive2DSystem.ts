'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import { listen } from '@tauri-apps/api/event'
import { convertFileSrc } from '@tauri-apps/api/core'
import { join } from '@/utils/path'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { PhysicalSize } from '@tauri-apps/api/dpi'

interface DeviceEvent {
  kind: string
  value?: any
}

// Live2D 类型定义
interface Live2DInstance {
  model?: any
  app?: {
    resize: () => void
  }
  load: (path: string) => Promise<void>
  getParameterRange: (id: string) => { min?: number; max?: number }
  setParameterValue: (id: string, value: number) => void
  playMotion?: (group: string, index: number) => Promise<void>
  playExpression?: (index: number) => Promise<void>
}

// 获取图片尺寸的工具函数
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    img.onerror = reject
    img.src = src
  })
}

// 等待 Canvas 元素可用
function waitForCanvas(id: string, maxAttempts = 10): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    
    const checkCanvas = () => {
      const canvas = document.getElementById(id) as HTMLCanvasElement
      if (canvas) {
        console.log('✅ Canvas element found:', id)
        resolve(canvas)
        return
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        reject(new Error(`Canvas element with id "${id}" not found after ${maxAttempts} attempts`))
        return
      }
      
      console.log(`⏳ Waiting for canvas element... (${attempts}/${maxAttempts})`)
      setTimeout(checkCanvas, 100)
    }
    
    checkCanvas()
  })
}

/**
 * 统一的Live2D系统Hook
 * 基于 BongoCat 的实现：窗口大小变化 + Live2D自适应
 */
export function useLive2DSystem() {
  const live2dRef = useRef<Live2DInstance | null>(null)
  const unlistenRef = useRef<(() => void) | null>(null)
  const isLoadingRef = useRef(false)
  
  const { currentModel, initializeModels } = useModelStore()
  const { 
    visible, 
    opacity, 
    scale, 
    mirrorMode,
    pressedLeftKeys,
    pressedRightKeys,
    setBackgroundImage 
  } = useCatStore()
  
  // 🎯 使用新的键盘处理逻辑
  useKeyboard()

  // 动态导入Live2D模块（避免SSR问题）
  const initializeLive2D = useCallback(async (): Promise<Live2DInstance | null> => {
    if (!live2dRef.current) {
      try {
        const { default: live2d } = await import('@/utils/live2d')
        live2dRef.current = live2d as Live2DInstance
      } catch (error) {
        console.error('Failed to load Live2D module:', error)
      }
    }
    return live2dRef.current
  }, [])

  // 🎯 基于 BongoCat 的窗口大小调整逻辑
  const handleScaleChange = useCallback(async () => {
    if (typeof window === 'undefined' || !currentModel) return
    
    try {
      const live2d = await initializeLive2D()
      if (!live2d) return

      // 获取背景图片
      const bgPath = join(currentModel.path, "resources", "background.png")
      const bgUrl = convertFileSrc(bgPath)
      
      // 获取背景图片的原始尺寸
      const { width, height } = await getImageSize(bgUrl)
      console.log('📏 Background image size:', { width, height, scale })

      // 🎯 关键：基于 BongoCat 的缩放计算方式
      // scale 在 catStore 中是小数（如 0.5, 1.0, 1.5）
      // 需要转换为百分比进行计算
      const scalePercent = scale * 100
      const newWidth = Math.round(width * scalePercent / 100)
      const newHeight = Math.round(height * scalePercent / 100)

      // 设置窗口大小（这会触发Live2D Canvas的自动调整）
      const appWindow = getCurrentWebviewWindow()
      await appWindow.setSize(new PhysicalSize({
        width: newWidth,
        height: newHeight,
      }))

      // Live2D模型会根据新的窗口尺寸自动调整
      setTimeout(() => {
        if (live2d.app) {
          live2d.app.resize()
        }
      }, 100) // 给窗口调整一点时间

      console.log('✅ Window and model scaled:', { newWidth, newHeight, scale, scalePercent })
    } catch (error) {
      console.error('❌ Failed to handle scale change:', error)
    }
  }, [initializeLive2D, currentModel, scale])

  // 加载模型和背景（修复 Canvas 查找问题）
  const loadModelAndAssets = useCallback(async (modelPath: string) => {
    if (isLoadingRef.current) {
      console.log('⏳ Model loading already in progress, skipping...')
      return
    }
    
    isLoadingRef.current = true
    
    try {
      console.log('🔄 Loading model and assets for:', modelPath)

      // 先设置背景图片
      const bgPath = join(modelPath, "resources", "background.png")
      const bgUrl = convertFileSrc(bgPath)
      setBackgroundImage(bgUrl)

      // 🎯 关键修复：等待 Canvas 元素可用
      await waitForCanvas('live2dCanvas')

      // 然后初始化 Live2D 并加载模型
      const live2d = await initializeLive2D()
      if (!live2d) {
        throw new Error('Failed to initialize Live2D')
      }

      // 加载 Live2D 模型
      await live2d.load(modelPath)

      // 🎯 加载完成后立即处理窗口大小调整
      await handleScaleChange()

      console.log('✅ Model and assets loaded successfully')
      return { backgroundImage: bgUrl, live2d }
    } catch (error) {
      console.error('❌ Failed to load model and assets:', error)
      throw error
    } finally {
      isLoadingRef.current = false
    }
  }, [initializeLive2D, setBackgroundImage, handleScaleChange])

  // 重新调整模型（简化版，主要用于Live2D Canvas的resize）
  const resizeModel = useCallback(async () => {
    const live2d = await initializeLive2D()
    if (live2d?.app) {
      live2d.app.resize()
    }
  }, [initializeLive2D])

  // 鼠标事件处理
  const setupMouseEvents = useCallback(async () => {
    const live2d = await initializeLive2D()
    if (!live2d) return

    try {
      const unlisten = await listen<DeviceEvent>('device-changed', ({ payload }) => {
        const { kind, value } = payload

        if (!live2d.model) return

        switch (kind) {
          case 'MouseMove': {
            if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
              const xRatio = value.x / window.screen.width
              const yRatio = value.y / window.screen.height

              // 鼠标追踪参数
              for (const id of ['ParamMouseX', 'ParamMouseY', 'ParamAngleX', 'ParamAngleY']) {
                const { min, max } = live2d.getParameterRange(id)
                if (min === undefined || max === undefined) continue

                const isXAxis = id.endsWith('X')
                const ratio = isXAxis ? xRatio : yRatio
                const paramValue = max - (ratio * (max - min))

                live2d.setParameterValue(id, paramValue)
              }
            }
            break
          }
          case 'MousePress': {
            if (typeof value === 'string') {
              const paramMap = {
                'Left': 'ParamMouseLeftDown',
                'Right': 'ParamMouseRightDown'
              } as const

              const paramId = paramMap[value as keyof typeof paramMap]
              if (paramId) {
                const { min, max } = live2d.getParameterRange(paramId)
                if (min !== undefined && max !== undefined) {
                  live2d.setParameterValue(paramId, max)
                }
              }
            }
            break
          }
          case 'MouseRelease': {
            if (typeof value === 'string') {
              const paramMap = {
                'Left': 'ParamMouseLeftDown',
                'Right': 'ParamMouseRightDown'
              } as const

              const paramId = paramMap[value as keyof typeof paramMap]
              if (paramId) {
                const { min, max } = live2d.getParameterRange(paramId)
                if (min !== undefined && max !== undefined) {
                  live2d.setParameterValue(paramId, min)
                }
              }
            }
            break
          }
        }
      })

      unlistenRef.current = unlisten
      console.log('✅ Mouse event listener established')
    } catch (error) {
      console.error('❌ Failed to setup mouse listener:', error)
    }
  }, [initializeLive2D])

  // 初始化整个系统
  useEffect(() => {
    void initializeModels()
  }, [initializeModels])

  // 当模型改变时，加载新模型和资源（添加延迟确保 DOM 已渲染）
  useEffect(() => {
    if (currentModel) {
      console.log('🎭 Model changed, loading:', currentModel.name, currentModel.path)
      // 添加小延迟确保 Canvas 元素已经渲染
      const timer = setTimeout(() => {
        void loadModelAndAssets(currentModel.path)
      }, 50)
      
      return () => clearTimeout(timer)
    }
  }, [currentModel?.id, currentModel?.path])

  // 🎯 监听缩放变化（关键修复）
  useEffect(() => {
    if (currentModel && scale > 0) {
      console.log('📏 Scale changed to:', scale)
      void handleScaleChange()
    }
  }, [scale, handleScaleChange, currentModel?.id])

  // 监听镜像模式变化，重新调整模型
  useEffect(() => {
    if (currentModel) {
      console.log('🪞 Mirror mode changed to:', mirrorMode)
      void resizeModel()
    }
  }, [mirrorMode, resizeModel, currentModel?.id])

  // 🎯 监听键盘状态变化，控制手部动画
  useEffect(() => {
    const updateHandState = async () => {
      const live2d = await initializeLive2D()
      if (!live2d) return

      // 左手状态
      const leftPressed = pressedLeftKeys.length > 0
      const leftParamId = 'CatParamLeftHandDown'
      const leftRange = live2d.getParameterRange(leftParamId)
      if (leftRange.min !== undefined && leftRange.max !== undefined) {
        live2d.setParameterValue(leftParamId, leftPressed ? leftRange.max : leftRange.min)
      }

      // 右手状态
      const rightPressed = pressedRightKeys.length > 0
      const rightParamId = 'CatParamRightHandDown'
      const rightRange = live2d.getParameterRange(rightParamId)
      if (rightRange.min !== undefined && rightRange.max !== undefined) {
        live2d.setParameterValue(rightParamId, rightPressed ? rightRange.max : rightRange.min)
      }
    }

    void updateHandState()
  }, [pressedLeftKeys, pressedRightKeys, initializeLive2D])

  // 设置鼠标事件监听
  useEffect(() => {
    void setupMouseEvents()

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, [setupMouseEvents])

  // 窗口大小调整监听
  useEffect(() => {
    const handleWindowResizeEvent = () => {
      void resizeModel()
    }

    window.addEventListener('resize', handleWindowResizeEvent)
    return () => window.removeEventListener('resize', handleWindowResizeEvent)
  }, [resizeModel])

  // 暴露Live2D实例和控制方法
  return {
    live2d: live2dRef.current,
    visible,
    opacity,
    scale,
    mirrorMode,
    handleScaleChange,
    resizeModel,
    // 直接暴露Live2D方法
    playMotion: useCallback(async (group: string, index: number) => {
      const live2d = await initializeLive2D()
      return live2d?.playMotion?.(group, index)
    }, [initializeLive2D]),
    
    playExpression: useCallback(async (index: number) => {
      const live2d = await initializeLive2D()
      return live2d?.playExpression?.(index)
    }, [initializeLive2D]),
    
    setParameterValue: useCallback(async (id: string, value: number) => {
      const live2d = await initializeLive2D()
      return live2d?.setParameterValue?.(id, value)
    }, [initializeLive2D])
  }
} 