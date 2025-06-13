// Live2D Manager - 只在客户端运行
class Live2DManager {
  private app: any = null
  public model: any = null
  private isClient: boolean = false

  constructor() {
    this.isClient = typeof window !== 'undefined'
  }

  private async mount() {
    if (!this.isClient) return

    const view = document.getElementById('live2dCanvas') as HTMLCanvasElement
    if (!view) {
      throw new Error('Canvas element with id "live2dCanvas" not found')
    }

    try {
      // 动态导入PIXI.js，避免SSR问题
      const { Application } = await import('pixi.js')
      
      this.app = new Application({
        view,
        resizeTo: window,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: devicePixelRatio,
      })
    } catch (error) {
      console.error('Failed to initialize PIXI application:', error)
      throw error
    }
  }

  public async load(modelPath: string) {
    if (!this.isClient) {
      console.warn('Live2D load called on server side, skipping')
      return { motions: {}, expressions: {} }
    }

    if (!this.app) {
      await this.mount()
    }

    this.destroy()

    try {
      // 动态导入Live2D相关库
      const { Cubism4ModelSettings, Live2DModel } = await import('pixi-live2d-display')
      const { Ticker } = await import('pixi.js')
      
      // 注册Ticker
      Live2DModel.registerTicker(Ticker)

      // 使用Tauri的asset协议访问模型文件
      let modelConfigPath: string
      let resolvedPath: string

      if (window.__TAURI_INTERNALS__) {
        // 在Tauri环境中使用asset协议
        const { convertFileSrc } = await import('@tauri-apps/api/core')
        resolvedPath = `assets/models/${modelPath}`
        modelConfigPath = convertFileSrc(`${resolvedPath}/cat.model3.json`)
      } else {
        // 在浏览器环境中使用public路径
        resolvedPath = `/models/${modelPath}`
        modelConfigPath = `${resolvedPath}/cat.model3.json`
      }
      
      console.log('Loading model from:', modelConfigPath)
      console.log('Resolved path:', resolvedPath)

      // 加载模型配置
      const response = await fetch(modelConfigPath)
      if (!response.ok) {
        throw new Error(`Failed to load model config: ${response.statusText}`)
      }
      
      const modelJSON = await response.json() as Record<string, any>

      // 创建模型设置
      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: modelConfigPath,
      } as any)

      // 替换文件路径为正确的路径
      modelSettings.replaceFiles((file: string) => {
        if (window.__TAURI_INTERNALS__) {
          const { convertFileSrc } = require('@tauri-apps/api/core')
          return convertFileSrc(`${resolvedPath}/${file}`)
        } else {
          return `${resolvedPath}/${file}`
        }
      })

      // 加载Live2D模型
      this.model = await Live2DModel.from(modelSettings)

      if (!this.model) {
        throw new Error('Failed to create Live2D model')
      }

      this.app.stage.addChild(this.model)

      // 设置模型位置和缩放
      this.model.anchor.set(0.5, 0.5)
      this.model.position.set(window.innerWidth / 2, window.innerHeight / 2)
      
      // 自适应缩放
      const scale = Math.min(window.innerWidth / this.model.width, window.innerHeight / this.model.height) * 0.8
      this.model.scale.set(scale)

      console.log('Model loaded successfully:', {
        width: this.model.width,
        height: this.model.height,
        scale: scale
      })

      const { motions, expressions } = modelSettings

      return {
        motions,
        expressions,
      }
    } catch (error) {
      console.error('Error loading Live2D model:', error)
      throw error
    }
  }

  public destroy() {
    if (this.model) {
      try {
        this.model.destroy()
      } catch (error) {
        console.warn('Error destroying model:', error)
      }
      this.model = null
    }
  }

  public playMotion(group: string, index: number) {
    if (!this.isClient || !this.model) return
    try {
      return this.model.motion(group, index)
    } catch (error) {
      console.warn('Error playing motion:', error)
    }
  }

  public playExpression(index: number) {
    if (!this.isClient || !this.model) return
    try {
      return this.model.expression(index)
    } catch (error) {
      console.warn('Error playing expression:', error)
    }
  }

  public getCoreModel() {
    if (!this.isClient || !this.model) return null
    const internalModel = this.model.internalModel
    return internalModel?.coreModel
  }

  public getParameterRange(id: string) {
    if (!this.isClient) return { min: 0, max: 1 }
    
    const coreModel = this.getCoreModel()
    
    if (!coreModel) return { min: 0, max: 1 }
    
    try {
      const index = coreModel.getParameterIndex?.(id)
      const min = coreModel.getParameterMinimumValue?.(index)
      const max = coreModel.getParameterMaximumValue?.(index)

      return {
        min: min ?? 0,
        max: max ?? 1,
      }
    } catch (error) {
      console.warn('Error getting parameter range:', id, error)
      return { min: 0, max: 1 }
    }
  }

  public setParameterValue(id: string, value: number) {
    if (!this.isClient) return
    
    const coreModel = this.getCoreModel()
    if (!coreModel) return
    
    try {
      return coreModel.setParameterValueById?.(id, Number(value))
    } catch (error) {
      console.warn('Error setting parameter:', id, value, error)
    }
  }
}

// 创建单例实例
const live2d = new Live2DManager()

export default live2d 