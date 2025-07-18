import { useEffect, useCallback } from "react";

/**
 * 窗口大小调整
 * 监听窗口 resize 事件并触发相应处理
 */
export function _useWindowResize(handleResize: () => void) {
  // 窗口大小调整事件处理
  const handleWindowResizeEvent = useCallback(() => {
    handleResize();
  }, [handleResize]);

  // 设置窗口大小调整监听
  useEffect(() => {
    window.addEventListener("resize", handleWindowResizeEvent);
    return () => {
      window.removeEventListener("resize", handleWindowResizeEvent);
    };
  }, [handleWindowResizeEvent]);

  return {
    handleWindowResizeEvent
  };
}
