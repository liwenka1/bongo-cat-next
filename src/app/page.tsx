"use client";

import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { useLive2D } from "@/hooks/useLive2D";
import { useKeyboard } from "@/hooks/useKeyboard";
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

  // 启用键盘监听
  useKeyboard();

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
      handleResize();
    };

    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleResize]);

  // 处理鼠标按下事件
  useEffect(() => {
    handleMouseDown(mousePressed.length > 0);
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

    handleKeyDown("left", hasLeftPressed);
    handleKeyDown("right", hasRightPressed);
  }, [pressedKeys, handleKeyDown]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${
        mirrorMode ? "-scale-x-100" : "scale-x-100"
      }`}
      style={{ opacity: opacity / 100 }}
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
    </div>
  );
}
