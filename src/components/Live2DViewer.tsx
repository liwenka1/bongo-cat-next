'use client'

import { useEffect, useRef, useState } from 'react'
import { useCatStore } from '@/stores/catStore'

interface Live2DViewerProps {
  modelPath?: string
  width?: number
  height?: number
}

export default function Live2DViewer({ 
  modelPath = '/models/default/model.json', 
  width = 300, 
  height = 300 
}: Live2DViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { scale, mirrorMode, opacity, pressedKeys, mousePressed } = useCatStore()

  useEffect(() => {
    const initPixi = async () => {
      if (!canvasRef.current) return

      try {
        // 动态导入PIXI.js
        const PIXI = await import('pixi.js')
        
        // 创建PIXI应用 (使用v6 API)
        const app = new PIXI.Application({
          view: canvasRef.current,
          width,
          height,
          backgroundColor: 0x000000,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })
        
        appRef.current = app

        // 尝试加载Live2D模型
        try {
          const { Live2DModel } = await import('pixi-live2d-display')
          
          // 加载Live2D模型
          const model = await Live2DModel.from(modelPath)
          
          if (model) {
            // 调整模型位置和大小
            model.anchor.set(0.5, 1)
            model.position.set(width / 2, height)
            model.scale.set(0.3)
            
            app.stage.addChild(model)
            
            // 添加交互
            model.interactive = true
            model.on('pointerdown', () => {
              console.log('Live2D model clicked!')
            })
          }
        } catch (live2dError) {
          console.warn('Live2D model loading failed, using placeholder:', live2dError)
          
          // 创建占位符图形
          const graphics = new PIXI.Graphics()
          graphics.beginFill(0x66ccff, 0.8)
          graphics.drawRoundedRect(0, 0, 200, 250, 20)
          graphics.endFill()
          
          graphics.beginFill(0x333333)
          graphics.drawCircle(60, 80, 15) // 左眼
          graphics.drawCircle(140, 80, 15) // 右眼
          graphics.drawRoundedRect(85, 120, 30, 20, 10) // 嘴巴
          graphics.endFill()
          
          graphics.position.set((width - 200) / 2, (height - 250) / 2)
          app.stage.addChild(graphics)
          
          // 添加文字
          const text = new PIXI.Text('BongoCat\nNext', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x333333,
            align: 'center'
          })
          text.anchor.set(0.5)
          text.position.set(width / 2, height / 2 + 80)
          app.stage.addChild(text)
        }
        
        setIsLoading(false)
        
      } catch (error) {
        console.error('Failed to initialize PIXI:', error)
        setError('Failed to load graphics engine')
        setIsLoading(false)
      }
    }

    void initPixi()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, true)
        appRef.current = null
      }
    }
  }, [modelPath, width, height])

  // 响应状态变化
  useEffect(() => {
    if (appRef.current) {
      const app = appRef.current
      
      // 更新整个stage的变换
      app.stage.scale.set(
        scale * (mirrorMode ? -1 : 1), 
        scale
      )
      
      // 如果有按键按下，添加一些视觉效果
      if (pressedKeys.length > 0 && app.stage.children.length > 0) {
        app.stage.children.forEach((child: any) => {
          if (child.tint !== undefined) {
            child.tint = 0xffff99 // 淡黄色
          }
        })
        
        // 1秒后恢复原色
        setTimeout(() => {
          if (app.stage) {
            app.stage.children.forEach((child: any) => {
              if (child.tint !== undefined) {
                child.tint = 0xffffff
              }
            })
          }
        }, 1000)
      }
    }
  }, [scale, mirrorMode, pressedKeys])

  return (
    <div 
      className="relative select-none"
      style={{ 
        opacity: opacity / 100
      }}
    >
      <canvas 
        ref={canvasRef}
        width={width}
        height={height}
        className="block cursor-pointer"
        onClick={() => {
          console.log('Cat clicked!')
        }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-2 left-2 right-2 text-xs text-red-500 bg-red-50 p-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
} 