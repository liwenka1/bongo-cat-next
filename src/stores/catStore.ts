import { create } from 'zustand'

interface CatState {
  // 显示状态
  visible: boolean
  opacity: number
  alwaysOnTop: boolean
  penetrable: boolean
  mirrorMode: boolean
  
  // 位置和大小
  x: number
  y: number
  scale: number
  
  // 交互状态
  pressedKeys: string[]
  mousePressed: boolean
  mousePosition: { x: number; y: number }
  
  // 模型相关
  currentModelPath: string
  
  // Actions
  setVisible: (visible: boolean) => void
  setOpacity: (opacity: number) => void
  setAlwaysOnTop: (alwaysOnTop: boolean) => void
  setPenetrable: (penetrable: boolean) => void
  setMirrorMode: (mirrorMode: boolean) => void
  setPosition: (x: number, y: number) => void
  setScale: (scale: number) => void
  setPressedKeys: (keys: string[]) => void
  setMousePressed: (pressed: boolean) => void
  setMousePosition: (x: number, y: number) => void
  setCurrentModelPath: (path: string) => void
}

export const useCatStore = create<CatState>((set) => ({
  // 初始状态
  visible: true,
  opacity: 100,
  alwaysOnTop: true,
  penetrable: false,
  mirrorMode: false,
  
  x: 0,
  y: 0,
  scale: 1,
  
  pressedKeys: [],
  mousePressed: false,
  mousePosition: { x: 0, y: 0 },
  
  currentModelPath: '',
  
  // Actions
  setVisible: (visible) => set({ visible }),
  setOpacity: (opacity) => set({ opacity }),
  setAlwaysOnTop: (alwaysOnTop) => set({ alwaysOnTop }),
  setPenetrable: (penetrable) => set({ penetrable }),
  setMirrorMode: (mirrorMode) => set({ mirrorMode }),
  setPosition: (x, y) => set({ x, y }),
  setScale: (scale) => set({ scale }),
  setPressedKeys: (pressedKeys) => set({ pressedKeys }),
  setMousePressed: (mousePressed) => set({ mousePressed }),
  setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
  setCurrentModelPath: (currentModelPath) => set({ currentModelPath }),
})) 