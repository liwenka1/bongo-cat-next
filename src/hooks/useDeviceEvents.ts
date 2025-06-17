'use client'

import { useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'

interface DeviceEvent {
  kind: 'MousePress' | 'MouseRelease' | 'MouseMove' | 'KeyboardPress' | 'KeyboardRelease'
  value: any
}

export function useDeviceEvents() {
  const unlistenRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const setupListener = async () => {
      try {
        // 动态导入 Live2D，避免 SSR 问题
        const { default: live2d } = await import('@/utils/live2d')

        unlistenRef.current = await listen<DeviceEvent>('device-changed', ({ payload }) => {
          const { kind, value } = payload

          // 🚀 直接在事件中处理 Live2D，无状态管理开销
          switch (kind) {
            case 'MouseMove': {
              if (value && typeof value === 'object' && 'x' in value && 'y' in value) {
                if (!live2d.model || typeof window === 'undefined') return

                const xRatio = value.x / window.screen.width
                const yRatio = value.y / window.screen.height

                // 直接更新 Live2D 参数，无中间状态
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
              if (typeof value === 'string' && live2d.model) {
                const isLeft = value === 'Left'
                const isRight = value === 'Right'

                if (isLeft) {
                  const { min, max } = live2d.getParameterRange('ParamMouseLeftDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('ParamMouseLeftDown', max)
                  }
                }
                if (isRight) {
                  const { min, max } = live2d.getParameterRange('ParamMouseRightDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('ParamMouseRightDown', max)
                  }
                }
              }
              break
            }
            case 'MouseRelease': {
              if (typeof value === 'string' && live2d.model) {
                const isLeft = value === 'Left'
                const isRight = value === 'Right'

                if (isLeft) {
                  const { min, max } = live2d.getParameterRange('ParamMouseLeftDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('ParamMouseLeftDown', min)
                  }
                }
                if (isRight) {
                  const { min, max } = live2d.getParameterRange('ParamMouseRightDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('ParamMouseRightDown', min)
                  }
                }
              }
              break
            }
            case 'KeyboardPress': {
              if (typeof value === 'string' && live2d.model) {
                // 简化键盘处理：左右手按键映射
                const leftKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
                const rightKeys = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyN', 'KeyM']

                if (leftKeys.includes(value)) {
                  const { min, max } = live2d.getParameterRange('CatParamLeftHandDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('CatParamLeftHandDown', max)
                  }
                }
                if (rightKeys.includes(value)) {
                  const { min, max } = live2d.getParameterRange('CatParamRightHandDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('CatParamRightHandDown', max)
                  }
                }
              }
              break
            }
            case 'KeyboardRelease': {
              if (typeof value === 'string' && live2d.model) {
                const leftKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
                const rightKeys = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyN', 'KeyM']

                if (leftKeys.includes(value)) {
                  const { min, max } = live2d.getParameterRange('CatParamLeftHandDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('CatParamLeftHandDown', min)
                  }
                }
                if (rightKeys.includes(value)) {
                  const { min, max } = live2d.getParameterRange('CatParamRightHandDown')
                  if (min !== undefined && max !== undefined) {
                    live2d.setParameterValue('CatParamRightHandDown', min)
                  }
                }
              }
              break
            }
          }
        })
        
        console.log('✅ Ultra-fast device listener established (zero overhead)')
      } catch (error) {
        console.error('❌ Failed to setup device listener:', error)
      }
    }

    void setupListener()

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current()
      }
    }
  }, []) // 空依赖，永不重建

  return {}
} 