"use client";

import { useEffect } from "react";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { useKeyboard } from "@/hooks/use-keyboard";
import { _useCore } from "@/hooks/live2d/_use-core";
import { _useModelLoader } from "@/hooks/live2d/_use-model-loader";
import { _useMouseEvents } from "@/hooks/live2d/_use-mouse-events";
import { _useKeyboardSync } from "@/hooks/live2d/_use-keyboard-sync";
import { _useMotionPlayer } from "@/hooks/live2d/_use-motion-player";
import { useWindowScaling } from "@/hooks/use-window-scaling";

/**
 * 统一的Live2D系统Hook
 * 组合各个功能模块的内部 hooks
 */
export function useLive2DSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  // 🎯 使用键盘处理逻辑
  useKeyboard();

  // Store 状态
  const { currentModel, initializeModels } = useModelStore();
  const { pressedLeftKeys, pressedRightKeys, selectedMotion, selectedExpression } = useCatStore();

  // 🔧 Live2D 核心管理
  const { initializeLive2D, getInstance, setLoading, isLoading } = _useCore();

  // 🔧 模型加载
  const { loadModelAndAssets } = _useModelLoader(initializeLive2D, setLoading, isLoading);

  // 🆕 统一窗口缩放和模型管理
  useWindowScaling(getInstance, canvasRef);

  // 🔧 鼠标事件处理
  const { setupMouseEvents, cleanup: cleanupMouseEvents } = _useMouseEvents(initializeLive2D);

  // 🔧 键盘状态同步
  const { updateHandState } = _useKeyboardSync(initializeLive2D);

  // 🔧 动作播放控制
  const { playMotionByName, playExpressionByName } = _useMotionPlayer(getInstance);

  // 🚀 初始化模型库
  useEffect(() => {
    void initializeModels();
  }, [initializeModels]);

  // 🎬 模型加载
  useEffect(() => {
    const canvas = canvasRef.current;
    if (currentModel && canvas) {
      void loadModelAndAssets(currentModel.path, currentModel.modelName, canvas);
    }
  }, [currentModel, canvasRef, loadModelAndAssets]);

  // 🖱️ 鼠标事件
  useEffect(() => {
    void setupMouseEvents();
    return cleanupMouseEvents;
  }, [setupMouseEvents, cleanupMouseEvents]);

  // ⌨️ 键盘状态同步
  useEffect(() => {
    void updateHandState(pressedLeftKeys, pressedRightKeys);
  }, [pressedLeftKeys, pressedRightKeys, updateHandState]);

  // 🎭 动作播放
  useEffect(() => {
    if (selectedMotion) {
      const { group, name } = selectedMotion;
      playMotionByName(group, name);
    }
  }, [selectedMotion, playMotionByName]);

  // 🎭 表情播放
  useEffect(() => {
    if (selectedExpression) {
      const { name } = selectedExpression;
      playExpressionByName(name);
    }
  }, [selectedExpression, playExpressionByName]);

  // 返回最简接口
  return {
    live2dInstance: getInstance()
  };
}
