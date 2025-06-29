"use client";

import { useEffect, useState } from "react";
import { useCatStore } from "@/stores/catStore";
import { useSharedMenu } from "@/hooks/useSharedMenu";
import { useTray } from "@/hooks/useTray";
import dynamic from "next/dynamic";

// 🎯 动态导入 CatViewer 避免 SSR 问题
const CatViewer = dynamic(() => import("@/components/cat-viewer"), {
  ssr: false,
  loading: () => <div className="h-screen w-screen bg-transparent" />
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  // 🎯 page.tsx 只负责应用级别的状态和事件
  const { opacity, mirrorMode } = useCatStore();
  const { showContextMenu } = useSharedMenu();
  const { createTray } = useTray();

  // 客户端检查和托盘初始化
  useEffect(() => {
    setIsClient(true);
    
    // 初始化系统托盘
    createTray().catch(console.error);
  }, [createTray]);

  // 处理窗口拖拽
  const handleWindowDrag = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      try {
        const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch (error) {
        console.error("Failed to start window dragging:", error);
      }
    }
  };

  // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Context menu requested at:", { x: e.clientX, y: e.clientY });
    void showContextMenu();
  };

  if (!isClient) {
    return <div className="h-screen w-screen bg-black" />;
  }

  return (
    <div
      className={`relative h-screen w-screen overflow-hidden ${mirrorMode ? "-scale-x-100" : "scale-x-100"}`}
      style={{ opacity: opacity / 100 }}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => void handleWindowDrag(e)}
    >
      {/* 🎯 所有 Live2D 渲染逻辑都由 CatViewer 负责 */}
      <CatViewer />
    </div>
  );
}
