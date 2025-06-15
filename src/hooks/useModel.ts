import { useEffect, useState } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { resolveResource } from '@tauri-apps/api/path'
import { readDir, readTextFile } from '@tauri-apps/plugin-fs'
import { Cubism4ModelSettings, Live2DModel } from 'pixi-live2d-display'
import { useModelStore } from '@/stores/modelStore'
import { join } from '@/utils/path'

// 动态导入live2d，避免SSR问题
let live2d: any = null

export function useModel() {
  const { currentModel, setMotions, setExpressions, initializeModels } = useModelStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 初始化模型列表
  useEffect(() => {
    void initializeModels()
  }, [initializeModels])

  // 获取背景图片路径
  const getBackgroundImage = () => {
    if (!currentModel) return null
    return convertFileSrc(join(currentModel.path, 'resources', 'background.png'))
  }

  // 加载模型
  const loadModel = async () => {
    if (!currentModel) {
      setError('No model selected')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查路径是否存在
      await resolveResource(currentModel.path)

      // 读取模型目录
      const files = await readDir(currentModel.path)
      const modelFile = files.find(file => file.name.endsWith('.model3.json'))

      if (!modelFile) {
        throw new Error('未找到模型主配置文件，请确认模型文件是否完整。')
      }

      const modelPath = join(currentModel.path, modelFile.name)
      const modelJSON = JSON.parse(await readTextFile(modelPath))

      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: convertFileSrc(modelPath),
      })

      // 替换文件路径为 Tauri 可访问的路径
      modelSettings.replaceFiles((file: string) => {
        return convertFileSrc(join(currentModel.path, file))
      })

      // 创建 Live2D 模型
      const model = await Live2DModel.from(modelSettings)

      // 更新存储中的动作和表情数据
      const { motions, expressions } = modelSettings
      setMotions(motions as any || {})
      setExpressions(expressions as any || [])

      return model
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load model'
      setError(errorMessage)
      console.error('Model loading error:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    currentModel,
    isLoading,
    error,
    backgroundImage: getBackgroundImage(),
    loadModel,
  }
} 