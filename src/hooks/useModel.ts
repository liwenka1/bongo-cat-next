import { useEffect, useCallback, useState } from 'react'
import { useCatStore } from '@/stores/catStore'

// 动态导入live2d，避免SSR问题
let live2d: any = null

export function useModel() {
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [modelData, setModelData] = useState<Record<string, any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  const { 
    scale, 
    mirrorMode, 
    pressedKeys, 
    mousePressed,
    mousePosition,
    currentModelPath 
  } = useCatStore()

  // 检查是否在客户端
  useEffect(() => {
    setIsClient(typeof window !== 'undefined')
    
    // 动态导入live2d模块
    if (typeof window !== 'undefined') {
      import('@/utils/live2d').then((module) => {
        live2d = module.default
      }).catch((err) => {
        console.error('Failed to load live2d module:', err)
      })
    }
  }, [])

  // 加载模型
  const handleLoad = useCallback(async () => {
    if (!isClient || !live2d || !currentModelPath) return

    setIsLoading(true)
    setError(null)

    try {
      const modelPath = `/models/${currentModelPath}`
      const data = await live2d.load(modelPath)
      
      setModelData(data)
      setBackgroundImage(`${modelPath}/resources/background.png`)
      
      console.log('Model loaded successfully:', data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model'
      setError(errorMessage)
      console.error('Error loading model:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentModelPath, isClient])

  // 销毁模型
  const handleDestroy = useCallback(() => {
    if (live2d) {
      live2d.destroy()
    }
  }, [])

  // 处理窗口大小调整
  const handleResize = useCallback(() => {
    if (!live2d || !live2d.model) return
    
    // 调整模型缩放以适应窗口
    live2d.model.scale.set(scale)
  }, [scale])

  // 处理键盘按下事件
  const handleKeyDown = useCallback((side: 'left' | 'right', pressed: boolean) => {
    if (!live2d) return
    
    const id = side === 'left' ? 'CatParamLeftHandDown' : 'CatParamRightHandDown'
    const { min, max } = live2d.getParameterRange(id)
    live2d.setParameterValue(id, pressed ? max : min)
  }, [])

  // 处理鼠标移动事件
  const handleMouseMove = useCallback(() => {
    if (!live2d || !live2d.model) return

    // 计算鼠标相对位置（这里简化处理，实际应该基于屏幕坐标）
    const xRatio = mousePosition.x / window.innerWidth
    const yRatio = mousePosition.y / window.innerHeight

    // 更新鼠标相关参数
    for (const id of ['ParamMouseX', 'ParamMouseY', 'ParamAngleX', 'ParamAngleY']) {
      const { min, max } = live2d.getParameterRange(id)
      
      const isXAxis = id.endsWith('X')
      const ratio = isXAxis ? xRatio : yRatio
      let value = max - (ratio * (max - min))

      if (isXAxis && mirrorMode) {
        value *= -1
      }

      live2d.setParameterValue(id, value)
    }
  }, [mousePosition, mirrorMode])

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((pressedMouses: string[]) => {
    if (!live2d) return
    
    const params = {
      ParamMouseLeftDown: pressedMouses.includes('Left'),
      ParamMouseRightDown: pressedMouses.includes('Right'),
    }

    for (const [id, pressed] of Object.entries(params)) {
      const { min, max } = live2d.getParameterRange(id)
      live2d.setParameterValue(id, pressed ? max : min)
    }
  }, [])

  // 响应模型变化
  useEffect(() => {
    if (isClient && live2d) {
      void handleLoad()
    }
  }, [handleLoad, isClient])

  // 响应设备事件
  useEffect(() => {
    if (isClient) {
      handleMouseMove()
    }
  }, [handleMouseMove, isClient])

  return {
    backgroundImage,
    modelData,
    isLoading,
    error,
    isClient,
    handleLoad,
    handleDestroy,
    handleResize,
    handleKeyDown,
    handleMouseMove,
    handleMouseDown,
  }
} 