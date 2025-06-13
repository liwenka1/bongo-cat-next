import { useEffect, useState, useCallback, useRef } from 'react'
import { useCatStore } from '@/stores/catStore'
import { isImage } from '@/utils/is'
import { join } from '@/utils/path'
import { isWindows } from '@/utils/platform'

interface MouseButtonEvent {
  kind: 'MousePress' | 'MouseRelease'
  value: string
}

interface MouseMoveValue {
  x: number
  y: number
}

interface MouseMoveEvent {
  kind: 'MouseMove'
  value: MouseMoveValue
}

interface KeyboardEvent {
  kind: 'KeyboardPress' | 'KeyboardRelease'
  value: string
}

type DeviceEvent = MouseButtonEvent | MouseMoveEvent | KeyboardEvent

export function useDevice() {
  const [supportLeftKeys, setSupportLeftKeys] = useState<string[]>([])
  const [supportRightKeys, setSupportRightKeys] = useState<string[]>([])
  const [pressedMouses, setPressedMouses] = useState<string[]>([])
  const [mousePosition, setMousePosition] = useState<MouseMoveValue>({ x: 0, y: 0 })
  const [pressedLeftKeys, setPressedLeftKeys] = useState<string[]>([])
  const [pressedRightKeys, setPressedRightKeys] = useState<string[]>([])
  
  const { currentModelPath, singleMode } = useCatStore()
  const releaseTimers = useRef(new Map<string, NodeJS.Timeout>())

  // 加载支持的按键列表
  const loadSupportedKeys = useCallback(async () => {
    if (!currentModelPath) return

    const keySides = [
      { side: 'left', setSupportKeys: setSupportLeftKeys, setPressedKeys: setPressedLeftKeys },
      { side: 'right', setSupportKeys: setSupportRightKeys, setPressedKeys: setPressedRightKeys },
    ]

    for (const { side, setSupportKeys, setPressedKeys } of keySides) {
      try {
        // 在Tauri环境中，这里应该使用真实的文件系统API
        // 现在先使用模拟数据
        const mockKeyFiles = [
          'KeyA.png', 'KeyS.png', 'KeyD.png', 'KeyF.png', 'KeyG.png', 'KeyH.png',
          'KeyJ.png', 'KeyK.png', 'KeyL.png', 'KeyQ.png', 'KeyW.png', 'KeyE.png',
          'KeyR.png', 'KeyT.png', 'KeyY.png', 'KeyU.png', 'KeyI.png', 'KeyO.png',
          'KeyP.png', 'KeyZ.png', 'KeyX.png', 'KeyC.png', 'KeyV.png', 'KeyB.png',
          'KeyN.png', 'KeyM.png', 'Space.png', 'Shift.png', 'Control.png',
          'Alt.png', 'Tab.png', 'Escape.png', 'Enter.png', 'Backspace.png'
        ]

        const supportedKeys = mockKeyFiles
          .filter(file => isImage(file))
          .map(file => file.split('.')[0])

        setSupportKeys(supportedKeys)
        
        // 过滤掉不支持的按键
        setPressedKeys(prev => prev.filter(key => supportedKeys.includes(key)))
      } catch (error) {
        console.error(`Failed to load ${side} keys:`, error)
        setSupportKeys([])
        setPressedKeys([])
      }
    }
  }, [currentModelPath])

  // 处理按键按下
  const handlePress = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, value?: string) => {
    if (!value) return

    setter(prev => {
      if (singleMode) {
        return [value]
      } else {
        return Array.from(new Set([...prev, value]))
      }
    })
  }, [singleMode])

  // 处理按键释放
  const handleRelease = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, value?: string) => {
    if (!value) return

    setter(prev => prev.filter(item => item !== value))
  }, [])

  // 获取支持的按键名（处理按键映射）
  const getSupportedKey = useCallback((key: string) => {
    for (const side of ['left', 'right']) {
      let nextKey = key
      const supportKeys = side === 'left' ? supportLeftKeys : supportRightKeys

      const unsupportedKeys = !supportKeys.includes(key)

      // F键映射到Fn
      if (key.startsWith('F') && unsupportedKeys) {
        nextKey = key.replace(/F(\d+)/, 'Fn')
      }

      // 修饰键映射
      for (const item of ['Meta', 'Shift', 'Alt', 'Control']) {
        if (key.startsWith(item) && unsupportedKeys) {
          const regex = new RegExp(`^(${item}).*`)
          nextKey = key.replace(regex, '$1')
        }
      }

      if (!supportKeys.includes(nextKey)) continue

      return nextKey
    }
    return null
  }, [supportLeftKeys, supportRightKeys])

  // 延时释放按键
  const handleScheduleRelease = useCallback((
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    key: string, 
    delay = 500
  ) => {
    const timers = releaseTimers.current
    
    if (timers.has(key)) {
      clearTimeout(timers.get(key))
    }

    const timer = setTimeout(() => {
      handleRelease(setter, key)
      timers.delete(key)
    }, delay)

    timers.set(key, timer)
  }, [handleRelease])

  // 处理设备事件
  const handleDeviceEvent = useCallback((event: DeviceEvent) => {
    const { kind, value } = event

    if (kind === 'KeyboardPress' || kind === 'KeyboardRelease') {
      const nextValue = getSupportedKey(value)
      if (!nextValue) return

      const isLeftSide = supportLeftKeys.includes(nextValue)
      const setter = isLeftSide ? setPressedLeftKeys : setPressedRightKeys

      // CapsLock特殊处理
      if (nextValue === 'CapsLock') {
        handlePress(setter, nextValue)
        handleScheduleRelease(setter, nextValue, 100)
        return
      }

      if (kind === 'KeyboardPress') {
        if (isWindows) {
          handleScheduleRelease(setter, nextValue)
        }
        handlePress(setter, nextValue)
        return
      }

      handleRelease(setter, nextValue)
      return
    }

    switch (kind) {
      case 'MousePress':
        handlePress(setPressedMouses, value)
        break
      case 'MouseRelease':
        handleRelease(setPressedMouses, value)
        break
      case 'MouseMove':
        setMousePosition(value)
        break
    }
  }, [getSupportedKey, supportLeftKeys, handlePress, handleRelease, handleScheduleRelease])

  // 模拟键盘事件监听（在真实环境中应该使用Tauri的事件监听）
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      handleDeviceEvent({
        kind: 'KeyboardPress',
        value: e.code || e.key
      })
    }

    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      handleDeviceEvent({
        kind: 'KeyboardRelease',
        value: e.code || e.key
      })
    }

    const handleMouseDown = (e: MouseEvent) => {
      const button = e.button === 0 ? 'Left' : e.button === 2 ? 'Right' : 'Middle'
      handleDeviceEvent({
        kind: 'MousePress',
        value: button
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      const button = e.button === 0 ? 'Left' : e.button === 2 ? 'Right' : 'Middle'
      handleDeviceEvent({
        kind: 'MouseRelease',
        value: button
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleDeviceEvent({
        kind: 'MouseMove',
        value: { x: e.clientX, y: e.clientY }
      })
    }

    if (typeof window !== 'undefined') {
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
  }, [handleDeviceEvent])

  // 加载支持的按键
  useEffect(() => {
    void loadSupportedKeys()
  }, [loadSupportedKeys])

  // 更新store中的状态
  useEffect(() => {
    const { setPressedKeys, setMousePressed, setMousePosition } = useCatStore.getState()
    setPressedKeys([...pressedLeftKeys, ...pressedRightKeys])
    setMousePressed(pressedMouses)
    setMousePosition(mousePosition.x, mousePosition.y)
  }, [pressedLeftKeys, pressedRightKeys, pressedMouses, mousePosition])

  return {
    pressedMouses,
    mousePosition,
    pressedLeftKeys,
    pressedRightKeys,
    supportLeftKeys,
    supportRightKeys,
  }
} 