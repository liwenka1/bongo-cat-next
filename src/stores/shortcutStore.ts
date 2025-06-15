import { create } from 'zustand'

export interface Shortcut {
  id: string
  name: string
  key: string
  description: string
  enabled: boolean
}

interface ShortcutState {
  shortcuts: Shortcut[]
  
  // Actions
  setShortcuts: (shortcuts: Shortcut[]) => void
  addShortcut: (shortcut: Shortcut) => void
  updateShortcut: (id: string, updates: Partial<Shortcut>) => void
  removeShortcut: (id: string) => void
  toggleShortcut: (id: string) => void
}

export const useShortcutStore = create<ShortcutState>((set) => ({
  shortcuts: [
    {
      id: 'toggle_visibility',
      name: '切换显示/隐藏',
      key: 'Ctrl+Alt+H',
      description: '显示或隐藏桌面猫咪',
      enabled: true,
    },
    {
      id: 'open_settings', 
      name: '打开设置',
      key: 'Ctrl+Alt+S',
      description: '打开偏好设置界面',
      enabled: true,
    },
    {
      id: 'toggle_penetrable',
      name: '切换穿透模式',
      key: 'Ctrl+Alt+P',
      description: '切换鼠标穿透模式',
      enabled: true,
    },
  ],
  
  setShortcuts: (shortcuts) => { set({ shortcuts }) },
  addShortcut: (shortcut) => { 
    set((state) => ({ 
      shortcuts: [...state.shortcuts, shortcut] 
    }))
  },
  updateShortcut: (id, updates) => {
    set((state) => ({
      shortcuts: state.shortcuts.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }))
  },
  removeShortcut: (id) => {
    set((state) => ({
      shortcuts: state.shortcuts.filter(s => s.id !== id)
    }))
  },
  toggleShortcut: (id) => {
    set((state) => ({
      shortcuts: state.shortcuts.map(s => 
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    }))
  },
})) 