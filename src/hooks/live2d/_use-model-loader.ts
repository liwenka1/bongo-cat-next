import { useCallback, useState } from "react";
import { join } from "@/utils/path";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { message } from "antd";
import type { CubismSpec } from "pixi-live2d-display";
import type { Live2DInstance } from "@/types";

/**
 * 模型加载器 Hook
 */
export function _useModelLoader(initializeLive2D: () => Promise<Live2DInstance | null>) {
  const [isModelLoading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [availableMotions, setAvailableMotions] = useState<{ group: string; name: string; displayName: string }[]>([]);
  const [availableExpressions, setAvailableExpressions] = useState<{ name: string; displayName: string }[]>([]);

  const isLoading = () => isModelLoading;

  // 加载模型和背景
  const loadModelAndAssets = useCallback(
    async (modelPath: string, modelFileName: string, canvas: HTMLCanvasElement) => {
      if (isLoading()) {
        return;
      }

      setLoading(true);

      try {
        // 优先清空旧的动作列表
        setAvailableMotions([]);
        // 优先清空旧的表情列表
        setAvailableExpressions([]);

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

        // 解析并设置动作列表
        const modelJsonPath = join(modelPath, modelFileName);
        const modelJson = JSON.parse(await readTextFile(modelJsonPath)) as CubismSpec.ModelJSON;
        const motions = modelJson.FileReferences.Motions;
        const expressions = modelJson.FileReferences.Expressions;

        // 为从JSON读取的动作文件定义接口
        interface MotionFile {
          File: string;
          Name?: string;
        }

        const availableMotions: { group: string; name: string; displayName: string }[] = [];
        for (const group in motions) {
          (motions[group] as MotionFile[]).forEach((motion) => {
            // 'name' 是内部名称，保持不变，用于播放
            const name = motion.File.split("/").pop()?.replace(".motion3.json", "") ?? "unknown";
            // 'displayName' 是显示名称，从 JSON 的 Name 字段读取
            const displayName = motion.Name ?? name; // 如果Name不存在，则回退到内部名称
            availableMotions.push({ group, name, displayName });
          });
        }
        setAvailableMotions(availableMotions);

        // 解析并设置表情列表
        const availableExpressions: { name: string; displayName: string }[] = [];
        if (expressions) {
          (expressions as MotionFile[]).forEach((expression, index) => {
            // 'name' 是内部名称，通常可以使用文件名前缀或索引
            const name = expression.File.split("/").pop()?.replace(".exp3.json", "") ?? `expression_${index}`;
            // 'displayName' 是显示名称，从 JSON 的 Name 字段读取
            const displayName = expression.Name ?? name;
            availableExpressions.push({ name, displayName });
          });
        }
        setAvailableExpressions(availableExpressions);
      } catch (error) {
        message.error(`Failed to load model: ${String(error)}`);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [initializeLive2D]
  );

  return {
    loadModelAndAssets,
    isLoading,
    backgroundImage,
    availableMotions,
    availableExpressions
  };
}
