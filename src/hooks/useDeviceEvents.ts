'use client'

import { useEffect } from 'react'
import { useCatStore } from '@/stores/catStore'

interface DeviceEvent {
  kind: 'MousePress' | 'MouseRelease' | 'MouseMove' | 'KeyboardPress' | 'KeyboardRelease'
  value: string | { x: number; y: number }
}

// 按键映射 - 将 rdev 的按键名称映射到标准的 KeyboardEvent.code
const keyMapping: Record<string, string> = {
  // 字母键
  'KeyA': 'KeyA', 'KeyB': 'KeyB', 'KeyC': 'KeyC', 'KeyD': 'KeyD', 'KeyE': 'KeyE',
  'KeyF': 'KeyF', 'KeyG': 'KeyG', 'KeyH': 'KeyH', 'KeyI': 'KeyI', 'KeyJ': 'KeyJ',
  'KeyK': 'KeyK', 'KeyL': 'KeyL', 'KeyM': 'KeyM', 'KeyN': 'KeyN', 'KeyO': 'KeyO',
  'KeyP': 'KeyP', 'KeyQ': 'KeyQ', 'KeyR': 'KeyR', 'KeyS': 'KeyS', 'KeyT': 'KeyT',
  'KeyU': 'KeyU', 'KeyV': 'KeyV', 'KeyW': 'KeyW', 'KeyX': 'KeyX', 'KeyY': 'KeyY',
  'KeyZ': 'KeyZ',
  
  // 数字键
  'Num0': 'Digit0', 'Num1': 'Digit1', 'Num2': 'Digit2', 'Num3': 'Digit3',
  'Num4': 'Digit4', 'Num5': 'Digit5', 'Num6': 'Digit6', 'Num7': 'Digit7',
  'Num8': 'Digit8', 'Num9': 'Digit9',
  
  // 功能键
  'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
  'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
  
  // 方向键
  'UpArrow': 'ArrowUp',
  'DownArrow': 'ArrowDown',
  'LeftArrow': 'ArrowLeft',
  'RightArrow': 'ArrowRight',
  
  // 其他常用键
  'Space': 'Space',
  'Return': 'Enter',
  'BackSpace': 'Backspace',
  'Tab': 'Tab',
  'Escape': 'Escape',
  'ShiftLeft': 'ShiftLeft',
  'ShiftRight': 'ShiftRight',
  'ControlLeft': 'ControlLeft',
  'ControlRight': 'ControlRight',
  'Alt': 'AltLeft',
  'AltGr': 'AltRight',
  'MetaLeft': 'MetaLeft',
  'MetaRight': 'MetaRight',
  'CapsLock': 'CapsLock',
}

// 定义左右手按键
const leftKeys = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB']
const rightKeys = ['KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'KeyN', 'KeyM', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']

function mapKeyName(keyName: string): string {
  // 移除引号（如果存在）
  const cleanKey = keyName.replace(/['"]/g, '')
  return keyMapping[cleanKey] || cleanKey
}

function isLeftKey(key: string): boolean {
  return leftKeys.includes(key)
}

function isRightKey(key: string): boolean {
  return rightKeys.includes(key)
}

export function useDeviceEvents() {
  const { 
    setPressedKeys, 
    setMousePressed, 
    setMousePosition,
    singleMode,
  } = useCatStore()

  useEffect(() => {
    let unlistenFn: (() => void) | null = null
    const pressedKeysSet = new Set<string>()
    const mouseButtonsPressed = new Set<string>()
    const leftKeysPressed = new Set<string>()
    const rightKeysPressed = new Set<string>()

    const updatePressedKeys = () => {
      if (singleMode) {
        // 单键模式：每只手只显示最后按下的一个按键
        const leftKey = Array.from(leftKeysPressed).slice(-1)
        const rightKey = Array.from(rightKeysPressed).slice(-1)
        setPressedKeys([...leftKey, ...rightKey])
      } else {
        // 正常模式：显示所有按下的按键
        setPressedKeys(Array.from(pressedKeysSet))
      }
    }

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        
        unlistenFn = await listen<DeviceEvent>('device-changed', (event) => {
          const { kind, value } = event.payload

          switch (kind) {
            case 'KeyboardPress':
              if (typeof value === 'string') {
                const mappedKey = mapKeyName(value)
                pressedKeysSet.add(mappedKey)
                
                // 根据按键类型更新左右手按键集合
                if (isLeftKey(mappedKey)) {
                  leftKeysPressed.add(mappedKey)
                } else if (isRightKey(mappedKey)) {
                  rightKeysPressed.add(mappedKey)
                }
                
                updatePressedKeys()
                console.log('Key pressed:', value, '->', mappedKey, 'Mode:', singleMode ? 'Single' : 'Multi')
              }
              break
              
            case 'KeyboardRelease':
              if (typeof value === 'string') {
                const mappedKey = mapKeyName(value)
                pressedKeysSet.delete(mappedKey)
                leftKeysPressed.delete(mappedKey)
                rightKeysPressed.delete(mappedKey)
                
                updatePressedKeys()
                console.log('Key released:', value, '->', mappedKey)
              }
              break
              
            case 'MousePress':
              if (typeof value === 'string') {
                mouseButtonsPressed.add(value)
                setMousePressed(Array.from(mouseButtonsPressed))
                console.log('Mouse pressed:', value)
              }
              break
              
            case 'MouseRelease':
              if (typeof value === 'string') {
                mouseButtonsPressed.delete(value)
                setMousePressed(Array.from(mouseButtonsPressed))
                console.log('Mouse released:', value)
              }
              break
              
            case 'MouseMove':
              if (typeof value === 'object' && 'x' in value && 'y' in value) {
                setMousePosition(value.x, value.y)
              }
              break
          }
        })

        console.log('Global device listener setup successfully')
      } catch (error) {
        console.error('Failed to setup device listener:', error)
        
        // 如果全局监听失败，回退到浏览器事件（仅在应用焦点时工作）
        console.log('Falling back to browser keyboard events...')
        
        const handleKeyDown = (event: KeyboardEvent) => {
          pressedKeysSet.add(event.code)
          
          if (isLeftKey(event.code)) {
            leftKeysPressed.add(event.code)
          } else if (isRightKey(event.code)) {
            rightKeysPressed.add(event.code)
          }
          
          updatePressedKeys()
        }
        
        const handleKeyUp = (event: KeyboardEvent) => {
          pressedKeysSet.delete(event.code)
          leftKeysPressed.delete(event.code)
          rightKeysPressed.delete(event.code)
          updatePressedKeys()
        }
        
        const handleMouseDown = (event: MouseEvent) => {
          const buttonName = ['Left', 'Middle', 'Right'][event.button]
          if (buttonName) {
            mouseButtonsPressed.add(buttonName)
            setMousePressed(Array.from(mouseButtonsPressed))
          }
        }
        
        const handleMouseUp = (event: MouseEvent) => {
          const buttonName = ['Left', 'Middle', 'Right'][event.button]
          if (buttonName) {
            mouseButtonsPressed.delete(buttonName)
            setMousePressed(Array.from(mouseButtonsPressed))
          }
        }
        
        const handleMouseMove = (event: MouseEvent) => {
          setMousePosition(event.clientX, event.clientY)
        }
        
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('mousemove', handleMouseMove)
        
        return () => {
          window.removeEventListener('keydown', handleKeyDown)
          window.removeEventListener('keyup', handleKeyUp)
          window.removeEventListener('mousedown', handleMouseDown)
          window.removeEventListener('mouseup', handleMouseUp)
          window.removeEventListener('mousemove', handleMouseMove)
        }
      }
    }

    void setupListener()

    return () => {
      if (unlistenFn) {
        unlistenFn()
      }
    }
  }, [setPressedKeys, setMousePressed, setMousePosition, singleMode])
} 