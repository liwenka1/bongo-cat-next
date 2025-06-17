import { create } from 'zustand'

interface CatState {
  // 显示状态
  visible: boolean
  opacity: number
  alwaysOnTop: boolean
  penetrable: boolean
  mirrorMode: boolean
  singleMode: boolean
  mouseMirror: boolean
  
  // 位置和大小
  x: number
  y: number
  scale: number
  
  // 交互状态
  pressedKeys: string[]
  mousePressed: string[]
  mousePosition: { x: number; y: number }
  
  // 模型相关
  currentModelPath: string
  
  // Actions
  setVisible: (visible: boolean) => void
  setOpacity: (opacity: number) => void
  setAlwaysOnTop: (alwaysOnTop: boolean) => void
  setPenetrable: (penetrable: boolean) => void
  setMirrorMode: (mirrorMode: boolean) => void
  setSingleMode: (singleMode: boolean) => void
  setMouseMirror: (mouseMirror: boolean) => void
  setPosition: (x: number, y: number) => void
  setScale: (scale: number) => void
  setPressedKeys: (keys: string[]) => void
  setMousePressed: (pressed: string[]) => void
  setMousePosition: (x: number, y: number) => void
  setCurrentModelPath: (path: string) => void
  
  // 新增：精细化控制方法
  addPressedKey: (key: string) => void
  removePressedKey: (key: string) => void
  addMousePressed: (button: string) => void
  removeMousePressed: (button: string) => void
}

export const useCatStore = create<CatState>((set, get) => ({
  // 初始状态
  visible: true,
  opacity: 100,
  alwaysOnTop: true,
  penetrable: false,
  mirrorMode: false,
  singleMode: false,
  mouseMirror: false,
  
  x: 0,
  y: 0,
  scale: 0.5,
  
  pressedKeys: [],
  mousePressed: [],
  mousePosition: { x: 0, y: 0 },
  
  currentModelPath: 'standard',
  
  // Actions
  setVisible: (visible) => { set({ visible }) },
  setOpacity: (opacity) => { set({ opacity }) },
  setAlwaysOnTop: (alwaysOnTop) => { set({ alwaysOnTop }) },
  setPenetrable: (penetrable) => { set({ penetrable }) },
  setMirrorMode: (mirrorMode) => { set({ mirrorMode }) },
  setSingleMode: (singleMode) => { set({ singleMode }) },
  setMouseMirror: (mouseMirror) => { set({ mouseMirror }) },
  setPosition: (x, y) => { set({ x, y }) },
  setScale: (scale) => { set({ scale }) },
  setPressedKeys: (pressedKeys) => { set({ pressedKeys }) },
  setMousePressed: (mousePressed) => { set({ mousePressed }) },
  setMousePosition: (x, y) => { set({ mousePosition: { x, y } }) },
  setCurrentModelPath: (currentModelPath) => { set({ currentModelPath }) },
  
  // 🎯 精细化键盘控制
  addPressedKey: (key) => {
    const { pressedKeys, singleMode } = get()
    if (singleMode) {
      set({ pressedKeys: [key] })
    } else {
      if (!pressedKeys.includes(key)) {
        set({ pressedKeys: [...pressedKeys, key] })
      }
    }
  },
  
  removePressedKey: (key) => {
    const { pressedKeys } = get()
    set({ pressedKeys: pressedKeys.filter(k => k !== key) })
  },
  
  // 🎯 精细化鼠标控制
  addMousePressed: (button) => {
    const { mousePressed } = get()
    if (!mousePressed.includes(button)) {
      set({ mousePressed: [...mousePressed, button] })
    }
  },
  
  removeMousePressed: (button) => {
    const { mousePressed } = get()
    set({ mousePressed: mousePressed.filter(b => b !== button) })
  },
})) 