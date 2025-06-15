import { useCallback } from 'react'
import { Menu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useCatStore } from '@/stores/catStore'
import { useAppStore } from '@/stores/appStore'

export function useSharedMenu() {
  const catStore = useCatStore()
  const appStore = useAppStore()

  const getSharedMenu = useCallback(async () => {
    return [
      {
        id: 'visibility',
        text: catStore.visible ? '隐藏' : '显示',
        action: () => {
          catStore.setVisible(!catStore.visible)
        },
      },
      {
        id: 'separator1',
        text: '---',
      },
      {
        id: 'penetrable',
        text: catStore.penetrable ? '取消穿透' : '启用穿透',
        action: () => {
          catStore.setPenetrable(!catStore.penetrable)
        },
      },
      {
        id: 'alwaysOnTop',
        text: catStore.alwaysOnTop ? '取消置顶' : '窗口置顶',
        action: () => {
          catStore.setAlwaysOnTop(!catStore.alwaysOnTop)
        },
      },
      {
        id: 'separator2',
        text: '---',
      },
      {
        id: 'settings',
        text: '偏好设置',
        action: () => {
          // TODO: Open settings window
          console.log('Opening settings...')
        },
      },
      {
        id: 'separator3',
        text: '---',
      },
      {
        id: 'quit',
        text: '退出',
        action: () => {
          try {
            const appWindow = getCurrentWebviewWindow()
            appWindow.close().catch((error: unknown) => {
              console.error('Failed to close window:', error)
            })
          } catch (error) {
            console.error('Failed to close window:', error)
          }
        },
      },
    ]
  }, [catStore])

  const showContextMenu = useCallback(async (event: React.MouseEvent) => {
    try {
      event.preventDefault()
      
      const menu = await Menu.new({
        items: await getSharedMenu(),
      })
      
      await menu.popup()
    } catch (error) {
      console.error('Failed to show context menu:', error)
    }
  }, [getSharedMenu])

  return {
    getSharedMenu,
    showContextMenu,
  }
} 