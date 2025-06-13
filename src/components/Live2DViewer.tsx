'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { Application, Ticker } from 'pixi.js'
import { Live2DModel, Cubism4ModelSettings } from 'pixi-live2d-display'
import type { Cubism4InternalModel } from 'pixi-live2d-display'

// 注册Ticker
Live2DModel.registerTicker(Ticker)

interface Live2DViewerProps {
  width?: number
  height?: number
  modelPath?: string
  onLoad?: (data: any) => void
  onError?: (error: Error) => void
}

export default function Live2DViewer({ 
  width = 300, 
  height = 300, 
  modelPath = '/models/keyboard',
  onLoad,
  onError 
}: Live2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const modelRef = useRef<Live2DModel | null>(null)

  const loadModel = useCallback(async (path: string) => {
    try {
      if (!appRef.current) return

      // 销毁之前的模型
      if (modelRef.current) {
        modelRef.current.destroy()
        modelRef.current = null
      }

      // 构建模型配置文件路径
      const modelConfigPath = `${path}/cat.model3.json`
      
      console.log('Loading model from:', modelConfigPath)

      // 加载模型配置
      const response = await fetch(modelConfigPath)
      if (!response.ok) {
        throw new Error(`Failed to load model config: ${response.statusText}`)
      }
      
      const modelJSON = await response.json() as Record<string, any>
      console.log('Model config loaded:', modelJSON)

      // 创建模型设置
      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: modelConfigPath,
      } as any)

      // 替换文件路径为正确的路径
      modelSettings.replaceFiles((file: string) => {
        return `${path}/${file}`
      })

      // 加载Live2D模型
      const model = await Live2DModel.from(modelSettings)
      
      if (!model) {
        throw new Error('Failed to create Live2D model')
      }

      modelRef.current = model
      appRef.current.stage.addChild(model)

      // 设置模型位置和缩放
      model.anchor.set(0.5, 0.5)
      model.position.set(width / 2, height / 2)
      
      // 自适应缩放
      const scale = Math.min(width / model.width, height / model.height) * 0.8
      model.scale.set(scale)

      console.log('Model loaded successfully:', {
        width: model.width,
        height: model.height,
        scale: scale
      })

      // 返回模型数据
      const modelData = {
        motions: modelSettings.motions,
        expressions: modelSettings.expressions,
        model: model
      }

      onLoad?.(modelData)

    } catch (error) {
      console.error('Error loading Live2D model:', error)
      onError?.(error as Error)
    }
  }, [width, height, onLoad, onError])

  const initApp = useCallback(() => {
    if (!canvasRef.current || appRef.current) return

    try {
      const app = new Application({
        view: canvasRef.current,
        width,
        height,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      })

      appRef.current = app
      console.log('PIXI Application initialized')

    } catch (error) {
      console.error('Error initializing PIXI application:', error)
      onError?.(error as Error)
    }
  }, [width, height, onError])

  const destroy = useCallback(() => {
    if (modelRef.current) {
      modelRef.current.destroy()
      modelRef.current = null
    }
    if (appRef.current) {
      appRef.current.destroy(true)
      appRef.current = null
    }
  }, [])

  // 设置参数值的方法
  const setParameterValue = useCallback((id: string, value: number) => {
    if (!modelRef.current) return

    try {
      const internalModel = modelRef.current.internalModel as Cubism4InternalModel
      const coreModel = internalModel?.coreModel
      
      if (coreModel && coreModel.setParameterValueById) {
        coreModel.setParameterValueById(id, Number(value))
      }
    } catch (error) {
      console.warn('Error setting parameter:', id, value, error)
    }
  }, [])

  // 获取参数范围的方法
  const getParameterRange = useCallback((id: string) => {
    if (!modelRef.current) return { min: 0, max: 1 }

    try {
      const internalModel = modelRef.current.internalModel as Cubism4InternalModel
      const coreModel = internalModel?.coreModel
      
      if (coreModel) {
        const index = coreModel.getParameterIndex?.(id)
        const min = coreModel.getParameterMinimumValue?.(index) ?? 0
        const max = coreModel.getParameterMaximumValue?.(index) ?? 1
        
        return { min, max }
      }
    } catch (error) {
      console.warn('Error getting parameter range:', id, error)
    }

    return { min: 0, max: 1 }
  }, [])

  // 播放动作
  const playMotion = useCallback((group: string, index: number) => {
    if (!modelRef.current) return
    
    try {
      return modelRef.current.motion(group, index)
    } catch (error) {
      console.warn('Error playing motion:', group, index, error)
    }
  }, [])

  // 播放表情
  const playExpression = useCallback((index: number) => {
    if (!modelRef.current) return
    
    try {
      return modelRef.current.expression(index)
    } catch (error) {
      console.warn('Error playing expression:', index, error)
    }
  }, [])

  useEffect(() => {
    initApp()
    return destroy
  }, [initApp, destroy])

  useEffect(() => {
    if (appRef.current && modelPath) {
      loadModel(modelPath)
    }
  }, [loadModel, modelPath])

  // 将方法暴露给父组件
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).live2dModel = {
        setParameterValue,
        getParameterRange,
        playMotion,
        playExpression,
        model: modelRef.current
      }
    }
  }, [setParameterValue, getParameterRange, playMotion, playExpression])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        imageRendering: 'pixelated'
      }}
    />
  )
} 