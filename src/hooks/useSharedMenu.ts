import { useCallback } from 'react'
import { Menu, CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'

export function useSharedMenu() {
  const catStore = useCatStore()
  const { models, currentModel, setCurrentModel } = useModelStore()

  const getScaleMenuItems = useCallback(async () => {
    const scaleOptions = [50, 75, 100, 125, 150]
    const currentScale = Math.round(catStore.scale * 100)

    const items = await Promise.all(
      scaleOptions.map(async (scaleValue) => {
        return await CheckMenuItem.new({
          text: scaleValue === 100 ? '默认' : `${scaleValue}%`,
          checked: currentScale === scaleValue,
          action: () => {
            catStore.setScale(scaleValue / 100)
          },
        })
      })
    )

    // 如果当前缩放不在预设选项中，添加自定义选项
    if (!scaleOptions.includes(currentScale)) {
      const customItem = await CheckMenuItem.new({
        text: `${currentScale}%`,
        checked: true,
        enabled: false,
      })
      items.unshift(customItem)
    }

    return items
  }, [catStore])

  const getOpacityMenuItems = useCallback(async () => {
    const opacityOptions = [25, 50, 75, 100]

    const items = await Promise.all(
      opacityOptions.map(async (opacityValue) => {
        return await CheckMenuItem.new({
          text: `${opacityValue}%`,
          checked: catStore.opacity === opacityValue,
          action: () => {
            catStore.setOpacity(opacityValue)
          },
        })
      })
    )

    // 如果当前透明度不在预设选项中，添加自定义选项
    if (!opacityOptions.includes(catStore.opacity)) {
      const customItem = await CheckMenuItem.new({
        text: `${catStore.opacity}%`,
        checked: true,
        enabled: false,
      })
      items.unshift(customItem)
    }

    return items
  }, [catStore.opacity])

  const getModeMenuItems = useCallback(async () => {
    return await Promise.all(
      models.map(async (model) => {
        return await CheckMenuItem.new({
          text: model.name,
          checked: currentModel?.id === model.id,
          action: () => {
            setCurrentModel(model)
          },
        })
      })
    )
  }, [models, currentModel, setCurrentModel])

  const getSharedMenu = useCallback(async () => {
    return await Promise.all([
      // 偏好设置
      MenuItem.new({
        text: '偏好设置...',
        action: () => {
          // TODO: 实现设置窗口
          console.log('Opening preferences...')
        },
      }),
      
      // 显示/隐藏
      MenuItem.new({
        text: catStore.visible ? '隐藏猫咪' : '显示猫咪',
        action: () => {
          catStore.setVisible(!catStore.visible)
        },
      }),
      
      // 分隔线
      PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 模式切换子菜单
      Submenu.new({
        text: '模式切换',
        items: await getModeMenuItems(),
      }),
      
      // 分隔线
      PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 窗口穿透
      CheckMenuItem.new({
        text: '窗口穿透',
        checked: catStore.penetrable,
        action: () => {
          catStore.setPenetrable(!catStore.penetrable)
        },
      }),
      
      // 始终置顶
      CheckMenuItem.new({
        text: '始终置顶',
        checked: catStore.alwaysOnTop,
        action: () => {
          catStore.setAlwaysOnTop(!catStore.alwaysOnTop)
        },
      }),
      
      // 镜像模式
      CheckMenuItem.new({
        text: '镜像模式',
        checked: catStore.mirrorMode,
        action: () => {
          catStore.setMirrorMode(!catStore.mirrorMode)
        },
      }),
      
      // 单键模式
      CheckMenuItem.new({
        text: '单键模式',
        checked: catStore.singleMode,
        action: () => {
          catStore.setSingleMode(!catStore.singleMode)
        },
      }),
      
      // 鼠标镜像 (仅在鼠标模式下显示)
      ...(currentModel?.mode === 'standard' ? [
        CheckMenuItem.new({
          text: '鼠标镜像',
          checked: catStore.mouseMirror,
          action: () => {
            catStore.setMouseMirror(!catStore.mouseMirror)
        },
        })
      ] : []),
      
      // 分隔线
      PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 窗口尺寸子菜单
      Submenu.new({
        text: '窗口尺寸',
        items: await getScaleMenuItems(),
      }),
      
      // 不透明度子菜单
      Submenu.new({
        text: '不透明度',
        items: await getOpacityMenuItems(),
      }),
      
      // 分隔线
      PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 退出
      MenuItem.new({
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
      }),
    ].flat()) // 使用 flat() 来处理条件性的菜单项
  }, [catStore, currentModel, getScaleMenuItems, getOpacityMenuItems, getModeMenuItems])

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