import { getName, getVersion, defaultWindowIcon } from '@tauri-apps/api/app';
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { TrayIcon } from '@tauri-apps/api/tray';
import type { TrayIconOptions } from '@tauri-apps/api/tray';
import { openUrl } from '@tauri-apps/plugin-opener';
import { exit, relaunch } from '@tauri-apps/plugin-process';
import { getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';

const TRAY_ID = 'BONGO_CAT_NEXT_TRAY';

// 辅助函数：显示窗口
const showWindow = async (label: string = 'main') => {
  const windows = await getAllWebviewWindows();
  const window = windows.find(w => w.label === label);
  if (window) {
    await window.show();
    await window.setFocus();
  }
};

// 辅助函数：隐藏窗口
const hideWindow = async (label: string = 'main') => {
  const windows = await getAllWebviewWindows();
  const window = windows.find(w => w.label === label);
  if (window) {
    await window.hide();
  }
};

export function useTray() {
  const createTray = async () => {
    const tray = await getTrayById();

    if (tray) return;

    const appName = await getName();
    const appVersion = await getVersion();

    const menu = await getTrayMenu();

    // 使用应用的默认图标作为托盘图标
    let icon;
    try {
      icon = await defaultWindowIcon();
    } catch (error) {
      console.warn('Failed to get default window icon:', error);
      // 如果获取默认图标失败，暂时不设置图标
      icon = undefined;
    }

    const options: TrayIconOptions = {
      menu,
      ...(icon && { icon }),
      id: TRAY_ID,
      tooltip: `${appName} v${appVersion}`,
      iconAsTemplate: false,
      menuOnLeftClick: true,
    };

    return TrayIcon.new(options);
  };

  const getTrayById = () => {
    return TrayIcon.getById(TRAY_ID);
  };

  const getTrayMenu = async () => {
    const appVersion = await getVersion();

    const items = await Promise.all([
      MenuItem.new({
        text: '显示猫咪',
        action: () => void showWindow('main'),
      }),
      MenuItem.new({
        text: '隐藏猫咪',
        action: () => void hideWindow('main'),
      }),
      MenuItem.new({
        text: '偏好设置',
        action: () => void showWindow('settings'),
      }),
      PredefinedMenuItem.new({ item: 'Separator' }),
      MenuItem.new({
        text: '开源地址',
        action: () => void openUrl('https://github.com/your-repo/bongo-cat-next'),
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
    ]);

    return Menu.new({ items });
  };

  const updateTrayMenu = async () => {
    const tray = await getTrayById();

    if (!tray) return;

    const menu = await getTrayMenu();

    await tray.setMenu(menu);
  };

  return {
    createTray,
    updateTrayMenu,
  };
} 