"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { useLive2D } from "@/hooks/useLive2D";
import { useSharedMenu } from "@/hooks/useSharedMenu";
import { useDeviceEvents } from "@/hooks/useDeviceEvents";
import { useWindowResize } from "@/hooks/useWindowResize";
import { KeyboardVisualization } from "@/components/KeyboardVisualization";
import { join } from "@/utils/path";
import Image from "next/image";

export default function Home() {
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  const {
    pressedKeys,
    mousePressed,
    mousePosition,
    scale,
    opacity,
    mirrorMode,
  } = useCatStore();

  const { currentModel, initializeModels } = useModelStore();

  const {
    isLoading: isLive2DLoading,
    error: live2dError,
    handleResize,
    handleMouseDown,
    handleKeyDown,
  } = useLive2D();

  // 启用右键菜单
  const { showContextMenu } = useSharedMenu();

  // 启用全局设备事件监听 (替代原来的 useKeyboard)
  useDeviceEvents();

  // 启用窗口大小调整功能
  const { isResizing, handleAutoResize } = useWindowResize();

  // 确保在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 初始化模型
  useEffect(() => {
    if (isClient) {
      void initializeModels();
    }
  }, [isClient, initializeModels]);

  // 加载背景图片
  useEffect(() => {
    if (isClient && currentModel) {
      const loadBackground = async () => {
        try {
          const bgPath = join(currentModel.path, "resources", "background.png");
          const bgUrl = convertFileSrc(bgPath);
          setBackgroundImage(bgUrl);
        } catch (error) {
          console.error("Failed to load background:", error);
        }
      };
      void loadBackground();
    }
  }, [isClient, currentModel]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleWindowResize = () => {
      void handleResize();
      void handleAutoResize();
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleResize, handleAutoResize]);

  // 处理鼠标按下事件
  useEffect(() => {
    void handleMouseDown(mousePressed.length > 0);
  }, [mousePressed, handleMouseDown]);

  // 处理键盘按下事件
  useEffect(() => {
    const leftKeys = [
      "KeyQ",
      "KeyW",
      "KeyE",
      "KeyR",
      "KeyT",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyF",
      "KeyG",
      "KeyZ",
      "KeyX",
      "KeyC",
      "KeyV",
      "KeyB",
    ];
    const rightKeys = [
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "KeyH",
      "KeyJ",
      "KeyK",
      "KeyL",
      "KeyN",
      "KeyM",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Space",
    ];

    const hasLeftPressed = pressedKeys.some((key) => leftKeys.includes(key));
    const hasRightPressed = pressedKeys.some((key) => rightKeys.includes(key));

    void handleKeyDown("left", hasLeftPressed);
    void handleKeyDown("right", hasRightPressed);
  }, [pressedKeys, handleKeyDown]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // 处理窗口拖拽
  const handleWindowDrag = async (e: React.MouseEvent) => {
    // 只在左键点击且没有按住其他键时启动拖拽
    if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      try {
        const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
        const appWindow = getCurrentWebviewWindow()
        await appWindow.startDragging()
      } catch (error) {
        console.error('Failed to start window dragging:', error)
      }
    }
  }

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${
        mirrorMode ? "-scale-x-100" : "scale-x-100"
      }`}
      style={{ opacity: opacity / 100 }}
      onContextMenu={(e) => { void showContextMenu(e) }}
              onMouseDown={(e) => { void handleWindowDrag(e) }}
    >
      {/* 背景图片 - 参考 BongoCat 原项目样式 */}
      {backgroundImage && (
        <Image
          width={612}
          height={354}
          src={backgroundImage}
          className="absolute size-full"
          alt="keyboard background"
        />
      )}

      {/* Live2D Canvas - 简化样式 */}
      <canvas id="live2dCanvas" className="absolute size-full" />

      {/* 键盘按键 - 简化为直接显示图片 */}
      <KeyboardVisualization />

      {/* 重绘状态提示 - 参考原项目样式 */}
      {isResizing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <span className="text-center text-5xl text-white font-bold">
            重绘中...
          </span>
        </div>
      )}
    </div>
  );
}
