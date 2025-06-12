'use client'

import { useEffect } from 'react'
import { useCatStore } from '@/stores/catStore'

interface DeviceEvent {
  kind: 'MousePress' | 'MouseRelease' | 'MouseMove' | 'KeyboardPress' | 'KeyboardRelease'
  value: string | { x: number; y: number }
}

export function useDeviceEvents() {
  const { 
    setPressedKeys, 
    setMousePressed, 
    setMousePosition,
    pressedKeys 
  } = useCatStore()

  useEffect(() => {
    let unlistenFn: (() => void) | null = null
    const pressedKeysSet = new Set<string>()

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event')
        
        unlistenFn = await listen<DeviceEvent>('device-changed', (event) => {
          const { kind, value } = event.payload

          switch (kind) {
            case 'KeyboardPress':
              if (typeof value === 'string') {
                pressedKeysSet.add(value)
                setPressedKeys(Array.from(pressedKeysSet))
              }
              break
              
            case 'KeyboardRelease':
              if (typeof value === 'string') {
                pressedKeysSet.delete(value)
                setPressedKeys(Array.from(pressedKeysSet))
              }
              break
              
            case 'MousePress':
              setMousePressed(true)
              break
              
            case 'MouseRelease':
              setMousePressed(false)
              break
              
            case 'MouseMove':
              if (typeof value === 'object' && 'x' in value && 'y' in value) {
                setMousePosition(value.x, value.y)
              }
              break
          }
        })
      } catch (error) {
        console.error('Failed to setup device listener:', error)
      }
    }

    void setupListener()

    return () => {
      if (unlistenFn) {
        unlistenFn()
      }
    }
  }, [setPressedKeys, setMousePressed, setMousePosition])
} 