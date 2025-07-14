import { useRef, useCallback } from "react";
import type { Live2DInstance } from "@/types";

/**
 * Live2D 核心实例管理
 * 处理 Live2D 模块的动态导入和实例管理
 */
export function _useCore() {
  const live2dRef = useRef<Live2DInstance | null>(null);
  const isLoadingRef = useRef(false);

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

  // 获取当前实例
  const getInstance = useCallback(() => {
    return live2dRef.current;
  }, []);

  // 设置加载状态
  const setLoading = useCallback((loading: boolean) => {
    isLoadingRef.current = loading;
  }, []);

  // 获取加载状态
  const isLoading = useCallback(() => {
    return isLoadingRef.current;
  }, []);

  return {
    initializeLive2D,
    getInstance,
    setLoading,
    isLoading
  };
}
