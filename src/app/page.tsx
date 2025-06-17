"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { useDeviceEvents } from "@/hooks/useDeviceEvents";
import { useSharedMenu } from "@/hooks/useSharedMenu";
import { join } from "@/utils/path";
import Image from "next/image";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  const { currentModel, initializeModels } = useModelStore();
  const { opacity, mirrorMode } = useCatStore();
  const { showContextMenu } = useSharedMenu();

  // 🚀 唯一的设备事件监听 - 直接处理 Live2D
  useDeviceEvents();

  // 客户端检查
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化模型
  useEffect(() => {
    if (isClient) {
      void initializeModels();
    }
  }, [isClient, initializeModels]);

  // 加载背景和模型
  useEffect(() => {
    if (isClient && currentModel) {
      const loadAssets = async () => {
        try {
          // 加载背景
          const bgPath = join(currentModel.path, "resources", "background.png");
          const bgUrl = convertFileSrc(bgPath);
          setBackgroundImage(bgUrl);
          
          // 🚀 动态加载 Live2D 模型，避免 SSR 问题
          const { default: live2d } = await import('@/utils/live2d');
          await live2d.load(currentModel.path);
          console.log('✅ Model loaded successfully');
        } catch (error) {
          console.error('❌ Failed to load assets:', error);
        }
      };
      void loadAssets();
    }
  }, [isClient, currentModel]);

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

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    void showContextMenu(e);
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
      {/* 背景图片 */}
      {backgroundImage && (
        <Image
          width={612}
          height={354}
          src={backgroundImage}
          className="absolute size-full"
          alt="keyboard background"
          priority
        />
      )}

      {/* Live2D Canvas - 关键的渲染目标 */}
      <canvas id="live2dCanvas" className="absolute size-full" />
    </div>
  );
}
