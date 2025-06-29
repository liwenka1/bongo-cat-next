'use client'

import type { TrayIconOptions } from '@tauri-apps/api/tray'

import { getName, getVersion } from '@tauri-apps/api/app'
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'
import { resolveResource } from '@tauri-apps/api/path'
import { TrayIcon } from '@tauri-apps/api/tray'
import { openUrl } from '@tauri-apps/plugin-opener'
import { exit, relaunch } from '@tauri-apps/plugin-process'

const TRAY_ID = 'BONGO_CAT_TRAY'

export function useTray() {
  const createTray = async () => {
    console.log('🔄 开始创建系统托盘...')
    
    try {
      // 检查是否已存在托盘
      const existingTray = await TrayIcon.getById(TRAY_ID)
      if (existingTray) {
        console.log('⚠️ 托盘已存在，跳过创建')
        return existingTray
      }

      console.log('📝 获取应用信息...')
      const appName = await getName()
      const appVersion = await getVersion()

      console.log('🍽️ 创建菜单项...')
      const menu = await getTrayMenu()

      console.log('🖼️ 获取托盘图标路径...')
      const icon = await resolveResource('assets/tray.png')

      console.log('🎯 创建托盘图标...')
      const options: TrayIconOptions = {
        menu,
        icon,
        id: TRAY_ID,
        tooltip: `${appName} v${appVersion}`,
        iconAsTemplate: false,
        menuOnLeftClick: true,
      }

      const tray = await TrayIcon.new(options)
      console.log('✅ 系统托盘创建成功')
      return tray
    } catch (error) {
      console.error('❌ 创建系统托盘失败:', error)
      throw error
    }
  }

  const getTrayMenu = async () => {
    const appVersion = await getVersion()

    const items = await Promise.all([
      MenuItem.new({
        text: '显示/隐藏猫咪',
        action: () => {
          // TODO: 实现显示/隐藏猫咪功能
          console.log('点击了显示/隐藏猫咪')
        },
      }),
      MenuItem.new({
        text: '偏好设置',
        action: () => {
          // TODO: 实现打开偏好设置功能
          console.log('点击了偏好设置')
        },
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      MenuItem.new({
        text: '开源地址',
        action: () => void openUrl('https://github.com/your-repo-url'),
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      MenuItem.new({
        text: `版本 ${appVersion}`,
        enabled: false,
      }),
      MenuItem.new({
        text: '重启应用',
        action: () => void relaunch(),
      }),
      MenuItem.new({
        text: '退出应用',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        action: () => void exit(0),
      }),
    ])

    return Menu.new({ items })
  }

  return {
    createTray,
  }
} 