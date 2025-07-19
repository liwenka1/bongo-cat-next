import { useCallback } from "react";
import type { Cubism4InternalModel } from "pixi-live2d-display";
import type { Live2DInstance } from "@/types";
import { message } from "antd";

/**
 * 动作和表情播放器
 * 管理 Live2D 模型的动作和表情播放
 */
export function _useMotionPlayer(getInstance: () => Live2DInstance | null) {
  // 播放随机动作
  const playRandomMotion = useCallback(() => {
    const live2d = getInstance();
    if (!live2d?.model?.internalModel) return;

    const internalModel = live2d.model.internalModel as Cubism4InternalModel;
    const motionGroups = internalModel.settings.motions;

    if (motionGroups) {
      const groupNames = Object.keys(motionGroups);
      if (groupNames.length > 0) {
        const randomGroup = groupNames[Math.floor(Math.random() * groupNames.length)];
        const motionsInGroup = motionGroups[randomGroup];
        if (motionsInGroup.length > 0) {
          const randomIndex = Math.floor(Math.random() * motionsInGroup.length);
          void live2d.playMotion(randomGroup, randomIndex);
        }
      }
    }
  }, [getInstance]);

  // 播放随机表情
  const playRandomExpression = useCallback(() => {
    const live2d = getInstance();
    if (!live2d?.model?.internalModel) return;

    const internalModel = live2d.model.internalModel as Cubism4InternalModel;
    const expressions = internalModel.settings.expressions;

    if (expressions && expressions.length > 0) {
      const randomIndex = Math.floor(Math.random() * expressions.length);
      void live2d.playExpression(randomIndex);
    }
  }, [getInstance]);

  // 播放指定的动作（根据名称）
  const playMotionByName = useCallback(
    (group: string, name: string) => {
      const live2d = getInstance();
      if (!live2d?.model?.internalModel) return;

      // 从模型配置中找到对应动作的索引
      const internalModel = live2d.model.internalModel as Cubism4InternalModel;
      const motionGroup = internalModel.settings.motions?.[group];

      if (motionGroup) {
        const index = motionGroup.findIndex((motion: { File: string }) => motion.File.endsWith(`${name}.motion3.json`));
        if (index !== -1) {
          void live2d.playMotion(group, index);
        } else {
          message.error(`Motion "${name}" not found in group "${group}"`);
        }
      }
    },
    [getInstance]
  );

  // 播放指定的表情（根据名称）
  const playExpressionByName = useCallback(
    (name: string) => {
      const live2d = getInstance();
      if (!live2d?.model?.internalModel) return;

      // 从模型配置中找到对应表情的索引
      const internalModel = live2d.model.internalModel as Cubism4InternalModel;
      const expressions = internalModel.settings.expressions;

      if (expressions) {
        const index = expressions.findIndex((expression: { File: string }) =>
          expression.File.endsWith(`${name}.exp3.json`)
        );
        if (index !== -1) {
          void live2d.playExpression(index);
        } else {
          message.error(`Expression "${name}" not found`);
        }
      }
    },
    [getInstance]
  );

  return {
    playRandomMotion,
    playRandomExpression,
    playMotionByName,
    playExpressionByName
  };
}
