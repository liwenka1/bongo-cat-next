import { useEffect, useState, useCallback } from 'react'
import { useModelStore } from '@/stores/modelStore'

// 动态导入 live2d 工具
let live2dInstance: any = null

async function getLive2D() {
  if (live2dInstance) {
    return live2dInstance
  }
  
  if (typeof window === 'undefined') {
    throw new Error('Live2D can only be used in browser environment')
  }
  
  const live2dModule = await import('@/utils/live2d')
  live2dInstance = live2dModule.default
  return live2dInstance
}

export function useLive2D() {
  const { currentModel, motions, expressions, setMotions, setExpressions } = useModelStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadModel = useCallback(async () => {
    if (!currentModel) {
      setError('No model selected')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const live2d = await getLive2D()
      const result = await live2d.load(currentModel.path)
      
      if (result) {
        setMotions(result.motions as any ?? {})
        setExpressions(result.expressions as any ?? [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load Live2D model'
      setError(errorMessage)
      console.error('Live2D model loading error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentModel, setMotions, setExpressions])

  const handleResize = useCallback(async () => {
    try {
      const live2d = await getLive2D()
      live2d.resize()
    } catch {
      // 忽略错误
    }
  }, [])

  const handleMouseDown = useCallback(async (pressed: boolean) => {
    if (pressed) {
      try {
        const live2d = await getLive2D()
        void live2d.playMotion('tap_body', 0)
      } catch {
        // 忽略错误
      }
    }
  }, [])

  const handleKeyDown = useCallback(async (side: 'left' | 'right', pressed: boolean) => {
    try {
      const live2d = await getLive2D()
      const parameterId = side === 'left' ? 'CatParamLeftHandDown' : 'CatParamRightHandDown'
      
      const { min, max } = live2d.getParameterRange(parameterId)
      const value = pressed ? max : min
      
      live2d.setParameterValue(parameterId, value)
    } catch (error) {
      // 静默处理错误
    }
  }, [])

  // 当模型改变时重新加载
  useEffect(() => {
    if (currentModel && typeof window !== 'undefined') {
      void loadModel()
    }
  }, [currentModel, loadModel])

  // 清理函数
  useEffect(() => {
    return () => {
      if (live2dInstance) {
        live2dInstance.destroy()
      }
    }
  }, [])

  return {
    isLoading,
    error,
    motions,
    expressions,
    handleResize,
    handleMouseDown,
    handleKeyDown,
    playMotion: async (group: string, index: number) => {
      try {
        const live2d = await getLive2D()
        return live2d.playMotion(group, index)
      } catch {
        return null
      }
    },
    playExpression: async (index: number) => {
      try {
        const live2d = await getLive2D()
        return live2d.playExpressions(index)
      } catch {
        return null
      }
    },
    setParameterValue: async (id: string, value: number) => {
      try {
        const live2d = await getLive2D()
        return live2d.setParameterValue(id, value)
      } catch {
        return null
      }
    },
    getParameterRange: async (id: string) => {
      try {
        const live2d = await getLive2D()
        return live2d.getParameterRange(id)
      } catch {
        return { min: 0, max: 1 }
      }
    },
  }
} 