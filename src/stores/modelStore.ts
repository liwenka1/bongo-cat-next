import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { resolveResource } from '@tauri-apps/api/path'
import { join } from '@/utils/path'

export type ModelMode = 'standard' | 'keyboard' | 'handle'

export interface Model {
  id: string
  path: string
  mode: ModelMode
  isPreset: boolean
  name?: string
}

export interface Motion {
  Name: string
  File: string
  Sound?: string
  FadeInTime: number
  FadeOutTime: number
  Description?: string
}

export type MotionGroup = Record<string, Motion[]>

export interface Expression {
  Name: string
  File: string
  Description?: string
}

interface ModelState {
  models: Model[]
  currentModel?: Model
  motions: MotionGroup
  expressions: Expression[]
  
  // Actions
  initializeModels: () => Promise<void>
  setCurrentModel: (model: Model) => void
  addModel: (model: Model) => void
  removeModel: (id: string) => void
  setMotions: (motions: MotionGroup) => void
  setExpressions: (expressions: Expression[]) => void
}

export const useModelStore = create<ModelState>()(
  subscribeWithSelector((set, get) => ({
    models: [],
    currentModel: undefined,
    motions: {},
    expressions: [],

    initializeModels: async () => {
      try {
        const modelsPath = await resolveResource('assets/models')
        
        const modes: ModelMode[] = ['standard', 'keyboard']
        const models: Model[] = []

        for (const mode of modes) {
          const path = join(modelsPath, mode)
          
          models.push({
            id: `preset-${mode}`,
            path,
            mode,
            isPreset: true,
          })
        }

        set({ 
          models,
          currentModel: models[1] // 默认使用 keyboard 模型
        })
      } catch (error) {
        console.error('Failed to initialize models:', error)
        // 设置默认值以防出错
        set({
          models: [],
          currentModel: undefined
        })
      }
    },

    setCurrentModel: (model) => {
      set({ currentModel: model })
    },
    addModel: (model) => {
      set((state) => ({ 
        models: [...state.models, model] 
      }))
    },
    removeModel: (id) => {
      set((state) => ({ 
        models: state.models.filter(m => m.id !== id) 
      }))
    },
    setMotions: (motions) => {
      set({ motions })
    },
    setExpressions: (expressions) => {
      set({ expressions })
    },
  }))
) 