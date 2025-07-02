import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { resolveResource } from "@tauri-apps/api/path";
import { join } from "@/utils/path";

export type ModelMode = "standard" | "keyboard" | "handle";

export interface Model {
  id: string;
  name: string;
  path: string;
  mode: ModelMode;
  isPreset: boolean;
  modelName: string;
}

export interface Motion {
  Name: string;
  File: string;
  Sound?: string;
  FadeInTime: number;
  FadeOutTime: number;
  Description?: string;
}

export type MotionGroup = Record<string, Motion[]>;

export interface Expression {
  Name: string;
  File: string;
  Description?: string;
}

interface ModelState {
  // State
  models: Model[];
  currentModel: Model | null;
  motions: MotionGroup;
  expressions: Expression[];

  // Actions
  setModels: (models: Model[]) => void;
  setCurrentModel: (model: Model | null) => void;
  setMotions: (motions: MotionGroup) => void;
  setExpressions: (expressions: Expression[]) => void;
  initializeModels: () => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  currentModel: null,
  motions: {},
  expressions: [],

  setModels: (models) => {
    set({ models });
  },
  setCurrentModel: (currentModel) => {
    set({ currentModel });
  },
  setMotions: (motions) => {
    set({ motions });
  },
  setExpressions: (expressions) => {
    set({ expressions });
  },

  initializeModels: async () => {
    const state = get();

    if (state.models.length > 0) {
      return;
    }

    try {
      // 解析 Tauri 资源路径
      const standardPath = await resolveResource("assets/models/standard");
      const keyboardPath = await resolveResource("assets/models/keyboard");
      const destroyPath = await resolveResource("assets/models/destroy");
      const normalPath = await resolveResource("assets/models/normal");

      // 初始化预设模型
      const presetModels: Model[] = [
        {
          id: "standard",
          name: "鼠标模式",
          path: standardPath,
          mode: "standard",
          isPreset: true,
          modelName: "cat.model3.json"
        },
        {
          id: "keyboard",
          name: "键盘模式",
          path: keyboardPath,
          mode: "keyboard",
          isPreset: true,
          modelName: "cat.model3.json"
        },
        {
          id: "destroy",
          name: "Destroy 模型",
          path: destroyPath,
          mode: "standard",
          isPreset: true,
          modelName: "destroy.model3.json"
        },
        {
          id: "normal",
          name: "Normal 模型",
          path: normalPath,
          mode: "standard",
          isPreset: true,
          modelName: "normal.model3.json"
        }
      ];

      set({
        models: presetModels,
        currentModel: presetModels.find((m) => m.mode === "keyboard") ?? presetModels[0]
      });
    } catch (error) {
      console.error("Failed to resolve model paths:", error);

      // 降级到直接使用路径（开发环境或者路径解析失败时）
      const presetModels: Model[] = [
        {
          id: "standard",
          name: "鼠标模式",
          path: "assets/models/standard",
          mode: "standard",
          isPreset: true,
          modelName: "cat.model3.json"
        },
        {
          id: "keyboard",
          name: "键盘模式",
          path: "assets/models/keyboard",
          mode: "keyboard",
          isPreset: true,
          modelName: "cat.model3.json"
        },
        {
          id: "destroy",
          name: "Destroy 模型",
          path: "assets/models/destroy",
          mode: "standard",
          isPreset: true,
          modelName: "destroy.model3.json"
        },
        {
          id: "normal",
          name: "Normal 模型",
          path: "assets/models/normal",
          mode: "standard",
          isPreset: true,
          modelName: "normal.model3.json"
        }
      ];

      set({
        models: presetModels,
        currentModel: presetModels.find((m) => m.mode === "keyboard") ?? presetModels[0]
      });
    }
  }
}));
