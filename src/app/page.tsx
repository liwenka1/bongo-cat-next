"use client";

import { useEffect } from "react";
import { useCatStore } from "@/stores/cat-store";
import { useSharedMenu } from "@/hooks/use-shared-menu";
import { useTray } from "@/hooks/use-tray";
import { useWindowEffects } from "@/hooks/use-window-effects";
import dynamic from "next/dynamic";
import { message } from "antd";

// 🎯 动态导入 CatViewer 避免 SSR 问题
const CatViewer = dynamic(() => import("@/components/cat-viewer"), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-transparent" />
});

export default function Home() {
  // 🎯 page.tsx 只负责应用级别的状态和事件
  const { mirrorMode } = useCatStore();
  const { showContextMenu } = useSharedMenu();
  const { createTray } = useTray();

  // 🎯 启用窗口效果管理
  useWindowEffects();

  // 托盘初始化
  useEffect(() => {
    // 在主页面创建托盘
    void createTray();
  }, []);

  // 处理窗口拖拽
  const handleWindowDrag = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      try {
        const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch (error) {
        message.error(`Failed to handle window drag: ${String(error)}`);
      }
    }
  };

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    void showContextMenu();
  };

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden ${mirrorMode ? "-scale-x-100" : "scale-x-100"}`}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => void handleWindowDrag(e)}
    >
      {/* 🎯 所有 Live2D 渲染逻辑都由 CatViewer 负责 */}
      <CatViewer />
    </div>
  );
}
