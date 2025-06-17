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

    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: devicePixelRatio,
    })
  }

  public async load(path: string) {
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

      this.app?.stage.addChild(this.model)

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
    this.model?.destroy()
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