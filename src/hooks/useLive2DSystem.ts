'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'
import { listen } from '@tauri-apps/api/event'
import { convertFileSrc } from '@tauri-apps/api/core'
import { join } from '@/utils/path'

interface DeviceEvent {
  kind: 'MousePress' | 'MouseRelease' | 'MouseMove' | 'KeyboardPress' | 'KeyboardRelease'
  value: any
}

/**
 * 统一的Live2D系统Hook
 * 整合了所有Live2D相关功能：模型加载、设备事件监听、参数控制等
 */
export function useLive2DSystem() {
  const live2dRef = useRef<any>(null)
  const unlistenRef = useRef<(() => void) | null>(null)
  
  const { currentModel, initializeModels } = useModelStore()
  const { 
    visible, 
    opacity, 
    scale, 
    mirrorMode,
    setBackgroundImage 
  } = useCatStore()

  // 动态导入Live2D模块（避免SSR问题）
  const initializeLive2D = useCallback(async () => {
    if (!live2dRef.current) {
      try {
        const { default: live2d } = await import('@/utils/live2d')
        live2dRef.current = live2d
      } catch (error) {
        console.error('Failed to load Live2D module:', error)
      }
    }
    return live2dRef.current
  }, [])

  // 加载模型和背景
  const loadModelAndAssets = useCallback(async (modelPath: string) => {
    try {
      const live2d = await initializeLive2D()
      if (!live2d) return

      // 并行加载背景和模型
      const [bgPath] = await Promise.all([
        // 加载背景图片
        (async () => {
          const bgPath = join(modelPath, "resources", "background.png")
          const bgUrl = convertFileSrc(bgPath)
          setBackgroundImage(bgUrl)
          return bgUrl
        })(),
        
        // 加载Live2D模型
        live2d.load(modelPath)
      ])

      console.log('✅ Model and assets loaded successfully')
      return { backgroundImage: bgPath, live2d }
    } catch (error) {
      console.error('❌ Failed to load model and assets:', error)
      throw error
    }
  }, [initializeLive2D, setBackgroundImage])

  // 设备事件处理
  const setupDeviceEvents = useCallback(async () => {
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
          case 'KeyboardPress':
          case 'KeyboardRelease': {
            if (typeof value === 'string') {
              const isPressed = kind === 'KeyboardPress'
              
              // 键盘分区映射
              const leftKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
              const rightKeys = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyN', 'KeyM']

              let paramId: string | null = null
              if (leftKeys.includes(value)) {
                paramId = 'CatParamLeftHandDown'
              } else if (rightKeys.includes(value)) {
                paramId = 'CatParamRightHandDown'
              }

              if (paramId) {
                const { min, max } = live2d.getParameterRange(paramId)
                if (min !== undefined && max !== undefined) {
                  live2d.setParameterValue(paramId, isPressed ? max : min)
                }
              }
            }
            break
          }
        }
      })

      unlistenRef.current = unlisten
      console.log('✅ Device event listener established')
    } catch (error) {
      console.error('❌ Failed to setup device listener:', error)
    }
  }, [initializeLive2D])

  // 窗口大小调整处理
  const handleResize = useCallback(async () => {
    const live2d = await initializeLive2D()
    if (live2d?.app) {
      live2d.app.resize()
    }
  }, [initializeLive2D])

  // 初始化整个系统
  useEffect(() => {
    void initializeModels()
  }, [initializeModels])

  // 当模型改变时，加载新模型和资源
  useEffect(() => {
    if (currentModel) {
      void loadModelAndAssets(currentModel.path)
    }
  }, [currentModel, loadModelAndAssets])

  // 设置设备事件监听
  useEffect(() => {
    void setupDeviceEvents()

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, [setupDeviceEvents])

  // 窗口大小调整监听
  useEffect(() => {
    const handleWindowResize = () => {
      void handleResize()
    }

    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleResize])

  // 暴露Live2D实例和控制方法
  return {
    live2d: live2dRef.current,
    visible,
    opacity,
    scale,
    mirrorMode,
    handleResize,
    // 直接暴露Live2D方法
    playMotion: useCallback(async (group: string, index: number) => {
      const live2d = await initializeLive2D()
      return live2d?.playMotion(group, index)
    }, [initializeLive2D]),
    
    playExpression: useCallback(async (index: number) => {
      const live2d = await initializeLive2D()
      return live2d?.playExpression(index)
    }, [initializeLive2D]),
    
    setParameterValue: useCallback(async (id: string, value: number) => {
      const live2d = await initializeLive2D()
      return live2d?.setParameterValue(id, value)
    }, [initializeLive2D])
  }
} 