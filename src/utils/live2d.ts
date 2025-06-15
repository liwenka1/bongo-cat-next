import { convertFileSrc } from '@tauri-apps/api/core'
import { join } from './path'
import { modelConfigs } from '@/data/modelConfig'

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined'

// 动态导入和初始化 Live2D
async function initLive2D() {
  if (!isBrowser) {
    throw new Error('Live2D can only be used in browser environment')
  }

  // 等待 Live2D 脚本加载
  let attempts = 0
  const maxAttempts = 100
  
  while (attempts < maxAttempts) {
    try {
      // 检查全局 Live2D 对象是否存在
      if ((window as any).Live2D || (window as any).Live2DFramework) {
        break
      }
    } catch {
      // 继续等待
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }

  // 动态导入必要的模块
  const [pixiModule, live2dModule] = await Promise.all([
    import('pixi.js'),
    import('pixi-live2d-display')
  ])

  const { Application, Ticker } = pixiModule
  const { Live2DModel, Cubism4ModelSettings } = live2dModule

  // 注册 Ticker
  Live2DModel.registerTicker(Ticker)

  return {
    Application,
    Live2DModel,
    Cubism4ModelSettings
  }
}

class Live2d {
  private app: any = null
  public model: any = null

  constructor() { }

  private async mount() {
    const { Application } = await initLive2D()
    const view = document.getElementById('live2dCanvas') as HTMLCanvasElement

    if (!view) {
      throw new Error('Canvas element not found')
    }

    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    })
  }

  public async load(path: string) {
    // 初始化 Live2D 模块
    const { Live2DModel: Live2DModelClass, Cubism4ModelSettings: Cubism4ModelSettingsClass } = await initLive2D()

    if (!this.app) {
      await this.mount()
    }

    this.destroy()

    // 从硬编码配置中获取模型数据，避免文件系统权限问题
    const modelName = path.includes('keyboard') ? 'keyboard' : 'standard'
    const modelJSON = modelConfigs[modelName as keyof typeof modelConfigs]
    
    if (!modelJSON) {
      throw new Error(`不支持的模型类型: ${modelName}`)
    }
    
    console.log('Loading model config for:', modelName)

    // 创建一个虚拟的模型配置文件路径
    const virtualModelPath = join(path, 'cat.model3.json')
    
    const modelSettings = new Cubism4ModelSettingsClass({
      ...modelJSON,
      url: convertFileSrc(virtualModelPath),
    } as any)

    modelSettings.replaceFiles((file: string) => {
      return convertFileSrc(join(path, file))
    })

    this.model = await Live2DModelClass.from(modelSettings)

    if (!this.model || !this.app) {
      throw new Error('Failed to create Live2D model or PIXI application')
    }

    this.app.stage.addChild(this.model)

    // 设置模型位置和缩放 - 让猫咪与键盘背景对齐
    this.model.anchor.set(0.5, 0.5)
    
    // 调整位置和缩放以匹配键盘背景
    // 根据窗口大小计算合适的缩放比例
    const windowScale = Math.min(
      this.app.screen.width / this.model.width,
      this.app.screen.height / this.model.height
    )
    
    // 设置缩放 - 让模型填满整个窗口
    const scale = windowScale * 1.0
    this.model.scale.set(scale)
    
    // 居中显示
    this.model.position.set(this.app.screen.width / 2, this.app.screen.height / 2)

    const { motions, expressions } = modelSettings

    return {
      motions,
      expressions,
    }
  }

  public destroy() {
    if (this.model) {
      this.model.destroy()
      this.model = null
    }
  }

  public playMotion(group: string, index: number) {
    return this.model?.motion(group, index)
  }

  public playExpressions(index: number) {
    return this.model?.expression(index)
  }

  public getCoreModel() {
    const internalModel = this.model?.internalModel
    return internalModel?.coreModel
  }

  public getParameterRange(id: string) {
    const coreModel = this.getCoreModel()
    if (!coreModel) return { min: 0, max: 1 }

    const index = coreModel.getParameterIndex?.(id)
    const min = coreModel.getParameterMinimumValue?.(index) ?? 0
    const max = coreModel.getParameterMaximumValue?.(index) ?? 1

    return { min, max }
  }

  public setParameterValue(id: string, value: number) {
    const coreModel = this.getCoreModel()
    return coreModel?.setParameterValueById?.(id, Number(value))
  }

  public resize() {
    if (this.app) {
      this.app.resize()
      
      // 重新调整模型位置和缩放以保持对齐
      if (this.model) {
        // 重新计算缩放
        const windowScale = Math.min(
          this.app.screen.width / this.model.width,
          this.app.screen.height / this.model.height
        )
        const scale = windowScale * 1.0
        this.model.scale.set(scale)
        
        // 居中显示
        this.model.position.set(this.app.screen.width / 2, this.app.screen.height / 2)
      }
    }
  }
}

const live2d = new Live2d()

export default live2d 