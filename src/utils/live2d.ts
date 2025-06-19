import type { Cubism4InternalModel } from 'pixi-live2d-display'
import { convertFileSrc } from '@tauri-apps/api/core'
import { Cubism4ModelSettings, Live2DModel } from 'pixi-live2d-display'
import { Application, Ticker } from 'pixi.js'
import { join } from './path'

// 🚀 完全复制原始项目的初始化方式
Live2DModel.registerTicker(Ticker)

class Live2d {
  private app: Application | null = null
  public model: Live2DModel | null = null

  constructor() { }

  private mount() {
    const view = document.getElementById('live2dCanvas') as HTMLCanvasElement

    if (!view) {
      throw new Error('Canvas element with id "live2dCanvas" not found')
    }

    // 清理现有的应用
    this.app?.destroy(true)

    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: devicePixelRatio,
      antialias: true,
    })

    // 确保canvas样式正确
    view.style.position = 'absolute'
    view.style.top = '0'
    view.style.left = '0'
    view.style.width = '100%'
    view.style.height = '100%'
    view.style.pointerEvents = 'none'
    view.style.zIndex = '2'

    console.log('Live2D Application mounted:', this.app.screen.width, 'x', this.app.screen.height)
  }

  public async load(path: string) {
    console.log('Loading Live2D model from:', path)

    if (!this.app) {
      this.mount()
    }

    this.destroy()

    // 🎯 直接使用固定的模型文件名，就像原始项目
    const modelPath = join(path, 'cat.model3.json')
    const modelUrl = convertFileSrc(modelPath)

    try {
      // 获取模型JSON配置
      const response = await fetch(modelUrl)
      if (!response.ok) {
        throw new Error(`Failed to load model config: ${response.statusText}`)
      }
      
      const modelJSON = await response.json()

      // 🚀 完全复制原始项目的模型设置创建方式
      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: modelUrl,
      })

      // 🚀 完全复制原始项目的文件路径替换逻辑
      modelSettings.replaceFiles((file: string) => {
        return convertFileSrc(join(path, file))
      })

      this.model = await Live2DModel.from(modelSettings)

      // 设置模型的初始位置和缩放
      if (this.model && this.app) {
        // 居中定位
        this.model.x = this.app.screen.width / 2
        this.model.y = this.app.screen.height / 2
        this.model.anchor.set(0.5, 0.5)

        // 初始缩放 - 适应窗口大小并留一些边距
        const scaleX = this.app.screen.width / this.model.width
        const scaleY = this.app.screen.height / this.model.height
        const scale = Math.min(scaleX, scaleY) * 0.8 // 稍微缩小一点留出边距

        this.model.scale.set(scale)

        this.app.stage.addChild(this.model)

        console.log('Live2D model loaded and positioned:', {
          x: this.model.x,
          y: this.model.y,
          scale: scale,
          modelSize: { width: this.model.width, height: this.model.height },
          screenSize: { width: this.app.screen.width, height: this.app.screen.height }
        })
      }

      // 🚀 完全复制原始项目的返回格式
      const { motions, expressions } = modelSettings

      return {
        motions,
        expressions,
      }
    } catch (error) {
      console.error('Live2D model loading error:', error)
      throw error
    }
  }

  public destroy() {
    if (this.model) {
      console.log('Destroying Live2D model')
      this.model.destroy()
      this.model = null
    }
  }

  public resize() {
    if (this.app && this.model) {
      console.log('Resizing Live2D model:', this.app.screen.width, 'x', this.app.screen.height)
      
      // 重新计算模型位置和缩放
      this.model.x = this.app.screen.width / 2
      this.model.y = this.app.screen.height / 2

      const scaleX = this.app.screen.width / this.model.width
      const scaleY = this.app.screen.height / this.model.height
      const scale = Math.min(scaleX, scaleY) * 0.8

      this.model.scale.set(scale)

      this.app.resize()

      console.log('Live2D model resized:', {
        x: this.model.x,
        y: this.model.y,
        scale: scale
      })
    }
  }

  public playMotion(group: string, index: number) {
    return this.model?.motion(group, index)
  }

  public playExpressions(index: number) {
    return this.model?.expression(index)
  }

  public getCoreModel() {
    const internalModel = this.model?.internalModel as Cubism4InternalModel
    return internalModel?.coreModel
  }

  public getParameterRange(id: string) {
    const coreModel = this.getCoreModel()

    const index = coreModel?.getParameterIndex(id)
    const min = coreModel?.getParameterMinimumValue(index)
    const max = coreModel?.getParameterMaximumValue(index)

    return {
      min,
      max,
    }
  }

  public setParameterValue(id: string, value: number) {
    const coreModel = this.getCoreModel()
    return coreModel?.setParameterValueById?.(id, Number(value))
  }
}

const live2d = new Live2d()

export default live2d 