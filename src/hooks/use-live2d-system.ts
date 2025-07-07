"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { useKeyboard } from "@/hooks/use-keyboard";
import { listen } from "@tauri-apps/api/event";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@/utils/path";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { PhysicalSize } from "@tauri-apps/api/dpi";
import type { DeviceEvent, Live2DInstance, ModelJSON } from "@/types";
import type { Cubism4InternalModel } from "pixi-live2d-display";

// 获取图片尺寸的工具函数
function getImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 统一的Live2D系统Hook
 * 窗口大小变化 + Live2D自适应
 */
export function useLive2DSystem(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const live2dRef = useRef<Live2DInstance | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const isLoadingRef = useRef(false);

  const { currentModel, initializeModels } = useModelStore();
  const {
    visible,
    opacity,
    scale,
    mirrorMode,
    pressedLeftKeys,
    pressedRightKeys,
    setBackgroundImage,
    selectedMotion,
    setAvailableMotions
  } = useCatStore();

  // 🎯 使用新的键盘处理逻辑
  useKeyboard();

  // 动态导入Live2D模块（避免SSR问题）
  const initializeLive2D = useCallback(async (): Promise<Live2DInstance | null> => {
    if (!live2dRef.current) {
      try {
        const { default: live2d } = await import("@/utils/live2d");
        live2dRef.current = live2d as unknown as Live2DInstance;
      } catch (error) {
        console.error("Failed to load Live2D module:", error);
      }
    }
    return live2dRef.current;
  }, []);

  // 🎯 窗口大小调整逻辑
  const handleScaleChange = useCallback(async () => {
    if (typeof window === "undefined" || !currentModel) return;

    try {
      const live2d = await initializeLive2D();
      if (!live2d) return;

      console.log("🎚️ Handling scale change:", {
        scale,
        currentModel: currentModel.name
      });

      // 获取背景图片
      const bgPath = join(currentModel.path, "resources", "background.png");
      const bgUrl = convertFileSrc(bgPath);

      // 获取背景图片的原始尺寸
      const { width, height } = await getImageSize(bgUrl);
      console.log("📏 Background image size:", { width, height, scale });

      // 缩放计算方式 - scale 现在是百分比（如 50, 100, 150）
      const scaleRatio = scale / 100;
      const newWidth = Math.round(width * scaleRatio);
      const newHeight = Math.round(height * scaleRatio);

      // 设置窗口大小（这会触发Live2D Canvas的自动调整）
      const appWindow = getCurrentWebviewWindow();
      await appWindow.setSize(
        new PhysicalSize({
          width: newWidth,
          height: newHeight
        })
      );

      // 🎯 统一缩放逻辑：先调整窗口大小，然后统一处理缩放
      // Live2D模型会根据新的窗口尺寸自动调整
      setTimeout(() => {
        live2d.resize();
        // 使用统一的缩放逻辑
        live2d.setUserScale(scaleRatio);
        console.log("✅ Live2D user scale updated with unified logic:", scaleRatio);
      }, 100); // 给窗口调整一点时间

      console.log("✅ Window and model scaled:", {
        newWidth,
        newHeight,
        scale
      });
    } catch (error) {
      console.error("❌ Failed to handle scale change:", error);
    }
  }, [initializeLive2D, currentModel, scale]);

  // 🎯 缩放逻辑
  const handleResize = useCallback(async () => {
    const live2d = await initializeLive2D();
    if (!live2d?.model || !currentModel) return;

    try {
      const { innerWidth, innerHeight } = window;

      // 获取背景图片尺寸
      const bgPath = join(currentModel.path, "resources", "background.png");
      const bgUrl = convertFileSrc(bgPath);
      const { width, height } = await getImageSize(bgUrl);

      // 🎯 统一缩放逻辑：使用 applyUserScale 方法来保持一致性
      // 移除直接的 model.scale.set 调用，改为使用统一的缩放方法
      live2d.model.scale.set(innerWidth / width);

      // 🎯 使用统一的缩放逻辑
      const currentUserScale = scale / 100;
      live2d.setUserScale(currentUserScale);

      // 🎯 关键修复：移除这里的 setSize 调用，这是导致无限循环的根本原因
      /*
      const currentRatio = Math.round((innerWidth / innerHeight) * 10) / 10;
      const targetRatio = Math.round((width / height) * 10) / 10;

      if (currentRatio !== targetRatio) {
        const appWindow = getCurrentWebviewWindow();
        await appWindow.setSize(
          new PhysicalSize({
            width: innerWidth,
            height: Math.ceil(innerWidth * (height / width))
          })
        );
      }
      */

      console.log("✅ Live2D resize completed (unified scaling):", {
        innerWidth,
        innerHeight,
        userScale: currentUserScale
      });
    } catch (error) {
      console.error("❌ Failed to resize:", error);
    }
  }, [initializeLive2D, currentModel, scale]);

  // 加载模型和背景
  const loadModelAndAssets = useCallback(
    async (modelPath: string, modelFileName: string, canvas: HTMLCanvasElement) => {
      if (isLoadingRef.current) {
        console.log("⏳ Model loading already in progress, skipping...");
        return;
      }

      isLoadingRef.current = true;

      try {
        console.log("🔄 Loading model and assets for:", modelPath, modelFileName);

        // 优先清空旧的动作列表
        setAvailableMotions([]);

        // 先设置背景图片
        const bgPath = join(modelPath, "resources", "background.png");
        const bgUrl = convertFileSrc(bgPath);
        setBackgroundImage(bgUrl);

        // 然后初始化 Live2D 并加载模型
        const live2d = await initializeLive2D();
        if (!live2d) {
          throw new Error("Failed to initialize Live2D");
        }

        // 加载 Live2D 模型
        await live2d.load(modelPath, modelFileName, canvas);

        // 🎯 解析并设置动作列表
        const modelJsonPath = join(modelPath, modelFileName);
        const modelJsonUrl = convertFileSrc(modelJsonPath);
        const response = await fetch(modelJsonUrl);
        const modelJson = (await response.json()) as ModelJSON;
        const motions = modelJson.FileReferences.Motions;
        const availableMotions: { group: string; name: string }[] = [];
        for (const group in motions) {
          motions[group].forEach((motion) => {
            // 从 "motions/idle.motion3.json" 中提取 "idle"
            const name = motion.File.split("/").pop()?.replace(".motion3.json", "") ?? "unknown";
            availableMotions.push({ group, name });
          });
        }
        setAvailableMotions(availableMotions);
        console.log("✅ Motions loaded:", availableMotions);

        // 🎯 不要在这里调用 handleResize
        console.log("✅ Model and assets loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load model and assets:", error);
        throw error;
      } finally {
        isLoadingRef.current = false;
      }
    },
    [initializeLive2D, setBackgroundImage, setAvailableMotions]
  );

  // 重新调整模型（简化版，主要用于Live2D Canvas的resize）
  const resizeModel = useCallback(async () => {
    const live2d = await initializeLive2D();
    live2d?.resize();
  }, [initializeLive2D]);

  // 鼠标事件处理
  const setupMouseEvents = useCallback(async () => {
    const live2d = await initializeLive2D();
    if (!live2d) return;

    try {
      const unlisten = await listen<DeviceEvent>("device-changed", ({ payload }) => {
        const { kind, value } = payload;

        if (!live2d.model) return;

        switch (kind) {
          case "MouseMove": {
            if (value && typeof value === "object" && "x" in value && "y" in value) {
              const mousePos = value as { x: number; y: number };
              const xRatio = mousePos.x / window.screen.width;
              const yRatio = mousePos.y / window.screen.height;

              // 鼠标追踪参数
              for (const id of ["ParamMouseX", "ParamMouseY", "ParamAngleX", "ParamAngleY"]) {
                const { min, max } = live2d.getParameterRange(id);
                if (min === undefined || max === undefined) continue;

                const isXAxis = id.endsWith("X");
                const ratio = isXAxis ? xRatio : yRatio;
                const paramValue = max - ratio * (max - min);

                live2d.setParameterValue(id, paramValue);
              }
            }
            break;
          }
          case "MousePress": {
            if (typeof value === "string") {
              const paramMap = {
                Left: "ParamMouseLeftDown",
                Right: "ParamMouseRightDown"
              } as const;

              const paramId = paramMap[value as keyof typeof paramMap];
              // paramId 来自 const 断言，总是存在的
              const { min, max } = live2d.getParameterRange(paramId);
              if (min !== undefined && max !== undefined) {
                live2d.setParameterValue(paramId, max);
              }
            }
            break;
          }
          case "MouseRelease": {
            if (typeof value === "string") {
              const paramMap = {
                Left: "ParamMouseLeftDown",
                Right: "ParamMouseRightDown"
              } as const;

              const paramId = paramMap[value as keyof typeof paramMap];
              // paramId 来自 const 断言，总是存在的
              const { min, max } = live2d.getParameterRange(paramId);
              if (min !== undefined && max !== undefined) {
                live2d.setParameterValue(paramId, min);
              }
            }
            break;
          }
        }
      });

      unlistenRef.current = unlisten;
      console.log("✅ Mouse event listener established");
    } catch (error) {
      console.error("❌ Failed to setup mouse listener:", error);
    }
  }, [initializeLive2D]);

  // 初始化整个系统
  useEffect(() => {
    void initializeModels();
  }, [initializeModels]);

  // 初始化模型
  useEffect(() => {
    const canvas = canvasRef.current;
    if (currentModel && canvas) {
      const loadAndResize = async () => {
        await loadModelAndAssets(currentModel.path, currentModel.modelName, canvas);
        // 在这里调用 handleResize
        await handleResize();
      };
      void loadAndResize();
    }
  }, [currentModel, canvasRef, loadModelAndAssets, handleResize]);

  // 🎯 监听 visible 状态变化，当从隐藏变为显示时重新加载模型
  useEffect(() => {
    const canvas = canvasRef.current;
    if (visible && currentModel && canvas) {
      console.log("👁️ Visibility changed to true, reloading model:", currentModel.modelName);
      const loadAndResize = async () => {
        await loadModelAndAssets(currentModel.path, currentModel.modelName, canvas);
        await handleResize();
      };
      void loadAndResize();
    }
  }, [visible, currentModel, canvasRef, loadModelAndAssets, handleResize]);

  // 🎯 监听缩放变化（关键修复）
  useEffect(() => {
    if (currentModel && scale > 0 && canvasRef.current) {
      console.log("📏 Scale changed to:", scale, "for model:", currentModel.modelName);
      void handleScaleChange();
    }
  }, [scale, handleScaleChange, currentModel?.id, canvasRef]);

  // 监听镜像模式变化，重新调整模型
  useEffect(() => {
    if (currentModel && canvasRef.current) {
      console.log("🪞 Mirror mode changed to:", mirrorMode);
      void handleResize();
    }
  }, [mirrorMode, handleResize, currentModel?.id, canvasRef]);

  // 🎯 监听键盘状态变化，控制手部动画
  useEffect(() => {
    const updateHandState = async () => {
      const live2d = await initializeLive2D();
      if (!live2d) return;

      // 左手状态
      const leftPressed = pressedLeftKeys.length > 0;
      const leftParamId = "CatParamLeftHandDown";
      const leftRange = live2d.getParameterRange(leftParamId);
      if (leftRange.min !== undefined && leftRange.max !== undefined) {
        live2d.setParameterValue(leftParamId, leftPressed ? leftRange.max : leftRange.min);
      }

      // 右手状态
      const rightPressed = pressedRightKeys.length > 0;
      const rightParamId = "CatParamRightHandDown";
      const rightRange = live2d.getParameterRange(rightParamId);
      if (rightRange.min !== undefined && rightRange.max !== undefined) {
        live2d.setParameterValue(rightParamId, rightPressed ? rightRange.max : rightRange.min);
      }
    };

    void updateHandState();
  }, [pressedLeftKeys, pressedRightKeys, initializeLive2D]);

  // 设置鼠标事件监听
  useEffect(() => {
    void setupMouseEvents();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [setupMouseEvents]);

  // 窗口大小调整监听
  useEffect(() => {
    const handleWindowResizeEvent = () => {
      void handleResize();
    };

    window.addEventListener("resize", handleWindowResizeEvent);
    return () => {
      window.removeEventListener("resize", handleWindowResizeEvent);
    };
  }, [handleResize]);

  const playMotion = useCallback((group: string, index?: number) => {
    if (live2dRef.current) {
      void live2dRef.current.playMotion(group, index);
    }
  }, []);

  const playExpression = useCallback((index: number) => {
    if (live2dRef.current) {
      void live2dRef.current.playExpression(index);
    }
  }, []);

  const setParameterValue = useCallback((id: string, value: number) => {
    live2dRef.current?.setParameterValue(id, value);
  }, []);

  // 🎯 当选中的动作变化时，播放它
  useEffect(() => {
    if (selectedMotion && live2dRef.current?.model?.internalModel) {
      const { group, name } = selectedMotion;
      console.log(`▶️ Playing motion: ${group} - ${name}`);

      // 从模型配置中找到对应动作的索引
      const internalModel = live2dRef.current.model.internalModel as Cubism4InternalModel;
      const motionGroup = internalModel.settings.motions?.[group];

      if (motionGroup) {
        const index = motionGroup.findIndex((motion: { File: string }) => motion.File.endsWith(`${name}.motion3.json`));
        if (index !== -1) {
          void live2dRef.current.playMotion(group, index);
        } else {
          console.error(`Motion "${name}" not found in group "${group}"`);
        }
      }
    }
  }, [selectedMotion]);

  // 处理 Tauri 事件
  useEffect(() => {
    const setupTauriListener = async () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
      unlistenRef.current = await listen<DeviceEvent>("device_event", (event) => {
        const { payload } = event;
        // console.log("Received device event:", payload);
        // ... update pressed keys based on payload
      });
    };

    void setupTauriListener();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, []);

  // 返回暴露给组件的接口
  return {
    visible,
    live2dInstance: live2dRef.current
  };
}
