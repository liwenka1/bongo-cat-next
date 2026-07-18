"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { useKeyboard } from "@/hooks/use-keyboard";
import { _useCore } from "@/hooks/live2d/_use-core";
import { _useModelLoader } from "@/hooks/live2d/_use-model-loader";
import { _useMouseEvents } from "@/hooks/live2d/_use-mouse-events";
import { _useKeyboardSync } from "@/hooks/live2d/_use-keyboard-sync";
import { _useMotionPlayer } from "@/hooks/live2d/_use-motion-player";
import { useWindowScaling } from "@/hooks/use-window-scaling";
import { useI18n } from "@/hooks/use-i18n";
import { validateLinkedModel } from "@/utils/model-link";
import { isTauriRuntime } from "@/utils/tauri";

/**
 * 统一的Live2D系统Hook
 * 组合各个功能模块的内部 hooks
 */
export function useLive2DSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { t } = useI18n(["models"]);

  // 🎯 使用键盘处理逻辑
  useKeyboard();

  // Store 状态
  const { currentModel, initializeModels, setCurrentModel, markLinkedModelInvalid } = useModelStore();
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
    if (!currentModel || !canvas) {
      return;
    }

    const loadCurrentModel = async () => {
      if (currentModel.linked && isTauriRuntime()) {
        if (currentModel.pathInvalid) {
          toast.error(t("pathNotFound", { ns: "models" }));
          // 🛡️ 无效 linked 模型 → 回退到 standard 预设模型
          setCurrentModel("standard");
          return;
        }

        const validation = await validateLinkedModel(currentModel.path, currentModel.modelName);
        if (!validation.valid) {
          markLinkedModelInvalid(currentModel.id);
          toast.error(t("pathNotFound", { ns: "models" }));
          // 🛡️ 路径失效 → markLinkedModelInvalid 已自动回退到 standard
          return;
        }
      }

      const loaded = await loadModelAndAssets(currentModel.path, currentModel.modelName, canvas);
      if (!loaded) {
        toast.error(t("loadFailed", { ns: "models" }));
        // 🛡️ 模型加载失败 → linked 模型标记无效并回退
        if (currentModel.linked) {
          markLinkedModelInvalid(currentModel.id);
        } else {
          setCurrentModel("standard");
        }
        return;
      }

      // 🎯 linked 模型默认即为有效（pathInvalid: undefined），无需额外标记
      //    调用 markLinkedModelValid 会改变 currentModel 引用导致 effect 无限循环
    };

    void loadCurrentModel();
  }, [
    currentModel,
    canvasRef,
    loadModelAndAssets,
    markLinkedModelInvalid,
    setCurrentModel,
    t
  ]);

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
