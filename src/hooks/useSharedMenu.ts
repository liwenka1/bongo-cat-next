import { useCallback, useEffect, useState } from 'react'
import { Menu, CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useCatStore } from '@/stores/catStore'
import { useModelStore } from '@/stores/modelStore'

export function useSharedMenu() {
  const [isClient, setIsClient] = useState(false)
  const catStore = useCatStore()
  const { models, currentModel, setCurrentModel } = useModelStore()

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getScaleMenuItems = useCallback(async () => {
    if (!isClient) return []
    
    // 缩放选项（50-150，每25一个档位）
    const scaleOptions = [50, 75, 100, 125, 150]
    const currentScale = catStore.scale

    const items = await Promise.all(
      scaleOptions.map(async (scaleValue) => {
        return await CheckMenuItem.new({
          text: scaleValue === 100 ? '默认' : `${scaleValue}%`,
          checked: currentScale === scaleValue,
          action: () => {
            console.log(`🎚️ Setting scale to ${scaleValue}%`)
            // 直接设置百分比值
            catStore.setScale(scaleValue)
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
  }, [catStore.scale, isClient])

  const getOpacityMenuItems = useCallback(async () => {
    if (!isClient) return []
    
    // 透明度选项
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
  }, [catStore.opacity, isClient])

  const getModeMenuItems = useCallback(async () => {
    if (!isClient) return []
    
    return await Promise.all(
      models.map(async (model) => {
        return await CheckMenuItem.new({
          text: model.name,
          checked: currentModel?.id === model.id,
          action: () => {
            console.log(`🎭 Switching to model: ${model.name}`)
            setCurrentModel(model)
          },
        })
      })
    )
  }, [models, currentModel, setCurrentModel, isClient])

  // 完整菜单结构
  const getSharedMenu = useCallback(async () => {
    if (!isClient) return []
    
    return await Promise.all([
      // 显示/隐藏猫咪
      await MenuItem.new({
        text: catStore.visible ? '隐藏猫咪' : '显示猫咪',
        action: () => {
          catStore.setVisible(!catStore.visible)
        },
      }),
      
      // 分隔符
      await PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 模型模式子菜单
      await Submenu.new({
        text: '模型模式',
        items: await getModeMenuItems(),
      }),
      
      // 分隔符
      await PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 窗口穿透
      await CheckMenuItem.new({
        text: '窗口穿透',
        checked: catStore.penetrable,
        action: () => {
          catStore.setPenetrable(!catStore.penetrable)
        },
      }),
      
      // 始终置顶
      await CheckMenuItem.new({
        text: '始终置顶',
        checked: catStore.alwaysOnTop,
        action: () => {
          catStore.setAlwaysOnTop(!catStore.alwaysOnTop)
        },
      }),
      
      // 镜像模式
      await CheckMenuItem.new({
        text: '镜像模式',
        checked: catStore.mirrorMode,
        action: () => {
          catStore.setMirrorMode(!catStore.mirrorMode)
        },
      }),
      
      // 分隔符
      await PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 窗口尺寸子菜单
      await Submenu.new({
        text: '窗口尺寸',
        items: await getScaleMenuItems(),
      }),
      
      // 不透明度子菜单
      await Submenu.new({
        text: '不透明度',
        items: await getOpacityMenuItems(),
      }),
      
      // 分隔符
      await PredefinedMenuItem.new({ item: 'Separator' }),
      
      // 设置页面
      await MenuItem.new({
        text: '设置',
        action: () => {
          void (async () => {
            const appWindow = getCurrentWebviewWindow()
            await appWindow.emit('navigate-to-settings')
          })()
        },
      }),
      
      // 退出
      await MenuItem.new({
        text: '退出',
        action: () => {
          void (async () => {
            const appWindow = getCurrentWebviewWindow()
            await appWindow.close()
          })()
        },
      }),
    ])
  }, [catStore, getModeMenuItems, getScaleMenuItems, getOpacityMenuItems, isClient])

  // 显示上下文菜单的方法
  const showContextMenu = useCallback(async () => {
    if (!isClient) return

    try {
      const menu = await Menu.new({
        items: await getSharedMenu(),
      })

      await menu.popup()
    } catch (error) {
      console.error('Failed to show context menu:', error)
    }
  }, [getSharedMenu, isClient])

  return {
    getSharedMenu,
    showContextMenu,
    getModeMenuItems,
    getScaleMenuItems,
    getOpacityMenuItems,
    isClient,
  }
} 