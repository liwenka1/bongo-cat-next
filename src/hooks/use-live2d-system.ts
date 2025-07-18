"use client";

import { useEffect } from "react";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { useKeyboard } from "@/hooks/use-keyboard";
import { _useCore } from "@/hooks/live2d/_use-core";
import { _useModelLoader } from "@/hooks/live2d/_use-model-loader";
import { _useScaling } from "@/hooks/live2d/_use-scaling";
import { _useMouseEvents } from "@/hooks/live2d/_use-mouse-events";
import { _useKeyboardSync } from "@/hooks/live2d/_use-keyboard-sync";
import { _useMotionPlayer } from "@/hooks/live2d/_use-motion-player";
import { _useWindowResize } from "@/hooks/live2d/_use-window-resize";

/**
 * 统一的Live2D系统Hook
 * 组合各个功能模块的内部 hooks
 */
export function useLive2DSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  // 🎯 使用键盘处理逻辑
  useKeyboard();

  // Store 状态
  const { currentModel, initializeModels } = useModelStore();
  const { scale, mirrorMode, pressedLeftKeys, pressedRightKeys, selectedMotion, selectedExpression } = useCatStore();

  // 🔧 Live2D 核心管理
  const { initializeLive2D, getInstance, setLoading, isLoading } = _useCore();

  // 🔧 模型加载
  const { loadModelAndAssets } = _useModelLoader(initializeLive2D, setLoading, isLoading);

  // 🔧 缩放处理
  const { handleScaleChange, handleResize } = _useScaling(initializeLive2D, isLoading);

  // 🔧 鼠标事件处理
  const { setupMouseEvents, cleanup: cleanupMouseEvents } = _useMouseEvents(initializeLive2D);

  // 🔧 键盘状态同步
  const { updateHandState } = _useKeyboardSync(initializeLive2D);

  // 🔧 动作播放控制
  const { playMotionByName, playExpressionByName } = _useMotionPlayer(getInstance);

  // 🔧 窗口大小调整监听
  _useWindowResize(() => {
    void handleResize(scale, currentModel);
  });

  // 🚀 初始化整个系统
  useEffect(() => {
    void initializeModels();
  }, [initializeModels]);

  // 🎬 初始化模型
  useEffect(() => {
    const canvas = canvasRef.current;
    if (currentModel && canvas) {
      const loadAndResize = async () => {
        await loadModelAndAssets(currentModel.path, currentModel.modelName, canvas);
        void handleResize(scale, currentModel);
      };
      void loadAndResize();
    }
  }, [currentModel, canvasRef, loadModelAndAssets, handleResize, scale]);

  // 📏 监听缩放变化
  useEffect(() => {
    if (currentModel && scale > 0 && canvasRef.current) {
      console.log("📏 Scale changed to:", scale, "for model:", currentModel.modelName);
      void handleScaleChange(scale, currentModel);
    }
  }, [scale, handleScaleChange, currentModel?.id, canvasRef]);

  // 🪞 监听镜像模式变化，重新调整模型
  useEffect(() => {
    if (currentModel && canvasRef.current) {
      console.log("🪞 Mirror mode changed to:", mirrorMode);
      void handleResize(scale, currentModel);
    }
  }, [mirrorMode, handleResize, currentModel?.id, canvasRef, scale]);

  // ⌨️ 监听键盘状态变化，控制手部动画
  useEffect(() => {
    void updateHandState(pressedLeftKeys, pressedRightKeys);
  }, [pressedLeftKeys, pressedRightKeys, updateHandState]);

  // 🖱️ 设置鼠标事件监听
  useEffect(() => {
    void setupMouseEvents();
    return cleanupMouseEvents;
  }, [setupMouseEvents, cleanupMouseEvents]);

  // 🎭 当选中的动作变化时，播放它
  useEffect(() => {
    if (selectedMotion) {
      const { group, name } = selectedMotion;
      playMotionByName(group, name);
    }
  }, [selectedMotion, playMotionByName]);

  // 🎭 当选中的表情变化时，播放它
  useEffect(() => {
    if (selectedExpression) {
      const { name } = selectedExpression;
      playExpressionByName(name);
    }
  }, [selectedExpression, playExpressionByName]);

  // 返回暴露给组件的接口
  return {
    live2dInstance: getInstance()
  };
}
