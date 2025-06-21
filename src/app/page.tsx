"use client";

import { useEffect, useState } from "react";
import { useCatStore } from "@/stores/catStore";
import { useSharedMenu } from "@/hooks/useSharedMenu";
import dynamic from "next/dynamic";

// 🎯 动态导入 CatViewer 避免 SSR 问题
const CatViewer = dynamic(() => import("@/components/CatViewer"), {
  ssr: false,
  loading: () => <div className="w-screen h-screen bg-transparent" />
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  // 🎯 page.tsx 只负责应用级别的状态和事件
  const { visible, opacity, mirrorMode } = useCatStore();
  const { showContextMenu } = useSharedMenu();

  // 客户端检查
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 处理窗口拖拽
  const handleWindowDrag = async (e: React.MouseEvent) => {
    if (e.button === 0) {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
        const appWindow = getCurrentWebviewWindow();
        await appWindow.startDragging();
      } catch (error) {
        console.error('Failed to start window dragging:', error);
      }
    }
  };

      // 右键菜单处理
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Context menu requested at:', { x: e.clientX, y: e.clientY });
    void showContextMenu();
  };

  if (!isClient) {
    return <div className="w-screen h-screen bg-black" />;
  }

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${
        mirrorMode ? "-scale-x-100" : "scale-x-100"
      }`}
      style={{ opacity: opacity / 100 }}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => void handleWindowDrag(e)}
    >
      {/* 🎯 所有 Live2D 渲染逻辑都由 CatViewer 负责 */}
      <CatViewer />
    </div>
  );
}
