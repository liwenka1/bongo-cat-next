"use client";

import { useEffect, useRef, useCallback } from 'react'
import { Menu } from '@tauri-apps/api/menu'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useCatStore } from '@/stores/catStore'
import { useDeviceEvents } from '@/hooks/useDeviceEvents'
import { useModel } from '@/hooks/useModel'
import { openGitCommitPage, openSettingsPage } from '@/utils/scripts'

export default function MainPage() {
  const { 
    visible, 
    opacity, 
    mirrorMode,
    scale,
    pressedKeys, 
    mousePressed,
    setCurrentModelPath
  } = useCatStore()
  
  const { 
    backgroundImage, 
    handleDestroy, 
    handleResize, 
    handleMouseDown, 
    handleMouseMove, 
    handleKeyDown 
  } = useModel()

  // 启用设备事件监听
  useDeviceEvents()

  // 初始化时设置默认模型
  useEffect(() => {
    setCurrentModelPath('keyboard')
  }, [setCurrentModelPath])

  // 组件卸载时清理
  useEffect(() => {
    return handleDestroy
  }, [handleDestroy])

  const handleWindowDrag = useCallback(async () => {
    try {
      const appWindow = getCurrentWebviewWindow()
      await appWindow.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }, [])

  const handleContextMenu = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault()
    
    try {
      // 创建右键菜单
      const menu = await Menu.new({
        items: [
          {
            id: 'settings',
            text: '偏好设置',
            action: () => {
              openSettingsPage().catch((err: unknown) => { 
                console.error('Failed to open settings page:', err) 
              })
            }
          },
          {
            id: 'git-commit',
            text: 'Git 提交工具',
            action: () => {
              openGitCommitPage().catch((err: unknown) => { 
                console.error('Failed to open git commit page:', err)
              })
            }
          },
          {
            id: 'separator',
            text: '---'
          },
          {
            id: 'hide',
            text: '隐藏',
            action: () => {
              useCatStore.getState().setVisible(false)
            }
          }
        ]
      })

      await menu.popup()
    } catch (error) {
      console.error('Failed to show context menu:', error)
    }
  }, [])

  // 解析键盘图片路径
  const resolveKeyImagePath = useCallback((key: string, side: 'left' | 'right' = 'left') => {
    return `/models/keyboard/resources/${side}-keys/${key}.png`
  }, [])

  if (!visible) {
    return null
  }

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ 
        opacity: opacity / 100,
        transform: `scale(${scale}) ${mirrorMode ? 'scaleX(-1)' : 'scaleX(1)'}`
      }}
      onContextMenu={(e) => void handleContextMenu(e)}
      onMouseDown={() => void handleWindowDrag()}
    >
      {/* 背景图片 */}
      {backgroundImage && (
        <img 
          src={backgroundImage} 
          alt="background"
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}

      {/* Live2D Canvas */}
      <canvas 
        id="live2dCanvas" 
        className="absolute inset-0 w-full h-full"
      />

      {/* 左手按键可视化 */}
      {pressedKeys.map((key) => (
        <img
          key={`left-${key}`}
          src={resolveKeyImagePath(key, 'left')}
          alt={`Left ${key}`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          onError={(e) => {
            // 如果左手图片不存在，尝试右手
            e.currentTarget.style.display = 'none'
          }}
        />
      ))}

      {/* 右手按键可视化 */}
      {pressedKeys.map((key) => (
        <img
          key={`right-${key}`}
          src={resolveKeyImagePath(key, 'right')}
          alt={`Right ${key}`}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ display: 'none' }}
          onLoad={(e) => {
            // 只有当右手图片存在时才显示
            e.currentTarget.style.display = 'block'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ))}

      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded pointer-events-none">
          <div>Pressed Keys: {pressedKeys.join(', ') || 'None'}</div>
          <div>Mouse: {mousePressed ? 'Pressed' : 'Released'}</div>
          <div>Opacity: {opacity}%</div>
          <div>Scale: {scale}</div>
          <div>Mirror: {mirrorMode ? 'On' : 'Off'}</div>
        </div>
      )}

      {/* 重新调整大小时的提示 */}
      <div 
        id="resize-indicator"
        className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center text-white text-5xl"
        style={{ display: 'none' }}
      >
        重绘中...
      </div>
    </div>
  )
}
