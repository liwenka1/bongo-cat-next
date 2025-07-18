"use client";

import type { TrayIconOptions } from "@tauri-apps/api/tray";

import { getName, getVersion } from "@tauri-apps/api/app";
import { resolveResource } from "@tauri-apps/api/path";
import { TrayIcon } from "@tauri-apps/api/tray";
import { useMenuFactory } from "@/hooks/use-menu-factory";
import { useEffect, useRef } from "react";

const TRAY_ID = "BONGO_CAT_TRAY";

export function useTray() {
  const { createMenu, menuStates } = useMenuFactory();
  const trayRef = useRef<TrayIcon | null>(null);

  const createTray = async () => {
    console.log("🔄 开始创建系统托盘...");

    try {
      // 检查是否已存在托盘
      const existingTray = await TrayIcon.getById(TRAY_ID);
      if (existingTray) {
        console.log("⚠️ 托盘已存在，跳过创建");
        trayRef.current = existingTray;
        // 更新现有托盘的菜单
        await updateTrayMenu(existingTray);
        return existingTray;
      }

      console.log("📝 获取应用信息...");
      const appName = await getName();
      const appVersion = await getVersion();

      console.log("🍽️ 创建菜单项...");
      const menu = await createMenu({ type: "tray" });

      console.log("🖼️ 获取托盘图标路径...");
      const icon = await resolveResource("assets/tray.png");

      console.log("🎯 创建托盘图标...");
      const options: TrayIconOptions = {
        menu,
        icon,
        id: TRAY_ID,
        tooltip: `${appName} v${appVersion}`,
        iconAsTemplate: false,
        menuOnLeftClick: true
      };

      const tray = await TrayIcon.new(options);
      trayRef.current = tray;
      console.log("✅ 系统托盘创建成功");
      return tray;
    } catch (error) {
      console.error("❌ 创建系统托盘失败:", error);
      throw error;
    }
  };

  const updateTrayMenu = async (tray: TrayIcon) => {
    try {
      const menu = await createMenu({ type: "tray" });
      await tray.setMenu(menu);
      console.log("🔄 托盘菜单已更新");
    } catch (error) {
      console.error("❌ 更新托盘菜单失败:", error);
    }
  };

  // 🎯 监听所有状态变化，自动更新托盘菜单
  useEffect(() => {
    const updateMenu = async () => {
      if (trayRef.current) {
        await updateTrayMenu(trayRef.current);
      }
    };

    void updateMenu();
  }, [menuStates]); // 依赖菜单状态

  return {
    createTray
  };
}
