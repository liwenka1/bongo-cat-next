'use client'

import { useEffect } from 'react'
import { useCatStore } from '@/stores/catStore'

export function useMouse() {
  const { setMousePressed, setMousePosition } = useCatStore()
  
  useEffect(() => {
    const handleMouseDown = () => {
      setMousePressed(true)
    }
    
    const handleMouseUp = () => {
      setMousePressed(false)
    }
    
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition(event.clientX, event.clientY)
    }
    
    // 监听全局鼠标事件
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [setMousePressed, setMousePosition])
} 