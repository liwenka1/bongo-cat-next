"use client";
import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Menu } from 'antd'
import { SettingOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { useCatStore } from '@/stores/catStore'
import { useDeviceEvents } from '@/hooks/useDeviceEvents'

// 动态导入Live2D组件，避免SSR问题
const Live2DViewer = dynamic(() => import('@/components/Live2DViewer'), { 
  ssr: false,
  loading: () => <div className="w-[300px] h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">Loading...</div>
})

export default function MainPage() {
  const { 
    visible, 
    opacity, 
    mirrorMode, 
    pressedKeys, 
    mousePressed,
    setVisible 
  } = useCatStore()
  
  // 启用设备事件监听
  useDeviceEvents()

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // 右键菜单功能
    console.log('Right click menu')
  }

  const openSettings = async () => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const settingsWindow = new WebviewWindow('settings', {
        url: '/settings',
        width: 800,
        height: 600,
        center: true,
        title: 'BongoCat Settings',
        resizable: true,
        decorations: true
      })
      
      await settingsWindow.show()
    } catch (error) {
      console.error('Failed to open settings window:', error)
    }
  }

  const handleWindowDrag = async () => {
    try {
      const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const mainWindow = getCurrentWebviewWindow()
      await mainWindow.startDragging()
    } catch (error) {
      console.error('Failed to start dragging:', error)
    }
  }

  if (!visible) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden select-none cursor-move"
      style={{ 
        opacity: opacity / 100,
        transform: mirrorMode ? 'scaleX(-1)' : 'scaleX(1)'
      }}
      onContextMenu={handleContextMenu}
      onMouseDown={handleWindowDrag}
    >
      {/* Live2D 模型显示区域 */}
      <div className="relative w-full h-full">
        <Live2DViewer 
          width={300}
          height={300}
        />
        
        {/* 键盘按键可视化 */}
        {pressedKeys.length > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs tauri-no-drag">
            Keys: {pressedKeys.slice(0, 5).join(', ')}
          </div>
        )}
        
        {/* 鼠标状态可视化 */}
        {mousePressed && (
          <div className="absolute top-4 right-4 bg-red-500 bg-opacity-50 text-white px-2 py-1 rounded text-xs tauri-no-drag">
            Mouse Pressed
          </div>
        )}
        
        {/* 浮动控制按钮 */}
        <div className="absolute bottom-4 right-4 flex gap-2 tauri-no-drag">
          <button
            onClick={() => setVisible(!visible)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
            title={visible ? "Hide" : "Show"}
          >
            {visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </button>
          
          <button
            onClick={openSettings}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Settings"
          >
            <SettingOutlined />
          </button>
        </div>
      </div>
    </div>
  )
}
