import { useCallback } from "react";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@/utils/path";
import { useCatStore } from "@/stores/cat-store";
import type { Live2DInstance } from "@/types";
import type { CubismSpec } from "pixi-live2d-display";
import { message } from "antd";

/**
 * 模型加载器Hook
 * 负责加载Live2D模型及其相关资源
 */
export function _useModelLoader(
  initializeLive2D: () => Promise<Live2DInstance | null>,
  setLoading: (loading: boolean) => void,
  isLoading: () => boolean
) {
  const { setBackgroundImage, setAvailableMotions, setAvailableExpressions } = useCatStore();

  const loadModelAndAssets = useCallback(
    async (modelPath: string, modelFileName: string, canvas: HTMLCanvasElement) => {
      if (isLoading()) return;

      setLoading(true);
      try {
        const live2d = await initializeLive2D();
        if (!live2d) {
          throw new Error("Failed to initialize Live2D");
        }

        // 设置背景图片
        const bgPath = join(modelPath, "resources", "background.png");
        const bgUrl = convertFileSrc(bgPath);
        setBackgroundImage(bgUrl);

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

        // 存储原始名称，让组件在渲染时动态翻译
        const availableMotions: { group: string; name: string; originalName: string }[] = [];
        for (const group in motions) {
          (motions[group] as MotionFile[]).forEach((motion) => {
            // 'name' 是内部名称，保持不变，用于播放
            const name = motion.File.split("/").pop()?.replace(".motion3.json", "") ?? "unknown";
            // 存储原始显示名称，供组件翻译使用
            const originalName = motion.Name ?? name;
            availableMotions.push({ group, name, originalName });
          });
        }
        setAvailableMotions(availableMotions);

        // 解析并设置表情列表
        const availableExpressions: { name: string; originalName: string }[] = [];
        if (expressions) {
          (expressions as MotionFile[]).forEach((expression, index) => {
            // 'name' 是内部名称，通常可以使用文件名前缀或索引
            const name = expression.File.split("/").pop()?.replace(".exp3.json", "") ?? `expression_${index}`;
            // 存储原始显示名称，供组件翻译使用
            const originalName = expression.Name ?? name;
            availableExpressions.push({ name, originalName });
          });
        }
        setAvailableExpressions(availableExpressions);
      } catch (error) {
        message.error(`Failed to load model: ${String(error)}`);
      } finally {
        setLoading(false);
      }
    },
    [initializeLive2D, setLoading, isLoading, setBackgroundImage, setAvailableMotions, setAvailableExpressions]
  );

  return {
    loadModelAndAssets
  };
}
