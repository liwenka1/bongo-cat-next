import { useCallback } from "react";
import type { Live2DInstance } from "@/types";
import type { Cubism4InternalModel } from "pixi-live2d-display";

/**
 * 动作播放控制
 * 处理 Live2D 动作和表情的播放
 */
export function _useMotionPlayer(getInstance: () => Live2DInstance | null) {
  // 播放动作
  const playMotion = useCallback(
    (group: string, index?: number) => {
      const live2d = getInstance();
      if (live2d) {
        void live2d.playMotion(group, index);
      }
    },
    [getInstance]
  );

  // 播放表情
  const playExpression = useCallback(
    (index: number) => {
      const live2d = getInstance();
      if (live2d) {
        void live2d.playExpression(index);
      }
    },
    [getInstance]
  );

  // 设置参数值
  const setParameterValue = useCallback(
    (id: string, value: number) => {
      const live2d = getInstance();
      live2d?.setParameterValue(id, value);
    },
    [getInstance]
  );

  // 播放指定的动作（根据名称）
  const playMotionByName = useCallback(
    (group: string, name: string) => {
      const live2d = getInstance();
      if (!live2d?.model?.internalModel) return;

      console.log(`▶️ Playing motion: ${group} - ${name}`);

      // 从模型配置中找到对应动作的索引
      const internalModel = live2d.model.internalModel as Cubism4InternalModel;
      const motionGroup = internalModel.settings.motions?.[group];

      if (motionGroup) {
        const index = motionGroup.findIndex((motion: { File: string }) => motion.File.endsWith(`${name}.motion3.json`));
        if (index !== -1) {
          void live2d.playMotion(group, index);
        } else {
          console.error(`Motion "${name}" not found in group "${group}"`);
        }
      }
    },
    [getInstance]
  );

  return {
    playMotion,
    playExpression,
    setParameterValue,
    playMotionByName
  };
}
