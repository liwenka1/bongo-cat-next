'use client'

import { useEffect } from 'react'
import { useCatStore } from '@/stores/catStore'

export function useKeyboard() {
  const { setPressedKeys } = useCatStore()
  
  useEffect(() => {
    const pressedKeys = new Set<string>()
    
    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeys.add(event.code)
      setPressedKeys(Array.from(pressedKeys))
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code)
      setPressedKeys(Array.from(pressedKeys))
    }
    
    // 监听全局键盘事件
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setPressedKeys])
} 