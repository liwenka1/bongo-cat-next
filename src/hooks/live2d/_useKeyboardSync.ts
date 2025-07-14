import { useCallback } from "react";
import type { Live2DInstance } from "@/types";

/**
 * 键盘状态同步
 * 根据键盘按键状态控制 Live2D 手部动画
 */
export function _useKeyboardSync(initializeLive2D: () => Promise<Live2DInstance | null>) {
  // 更新手部状态
  const updateHandState = useCallback(
    async (pressedLeftKeys: string[], pressedRightKeys: string[]) => {
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
    },
    [initializeLive2D]
  );

  return {
    updateHandState
  };
}
