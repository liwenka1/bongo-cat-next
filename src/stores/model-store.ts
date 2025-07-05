import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

export interface ModelConfig {
  id: string;
  name: string;
  path: string;
  mode: ModelMode;
  isPreset: boolean;
  modelName: string;
}

export interface ModelStoreState {
  models: Record<string, Model>;
  currentModel: Model | null;
  initializeModels: () => Promise<void>;
  setCurrentModel: (id: string) => void;
}

export const useModelStore = create<ModelStoreState>()(
  persist(
    (set, get) => ({
      models: {},
      currentModel: null,
      initializeModels: async () => {
        const presetModels: Model[] = [
          { id: "standard", name: "鼠标模式", path: "assets/models/standard", mode: "standard", isPreset: true, modelName: "cat.model3.json" },
          { id: "keyboard", name: "键盘模式", path: "assets/models/keyboard", mode: "keyboard", isPreset: true, modelName: "cat.model3.json" },
          { id: "destroy", name: "Destroy 模型", path: "assets/models/destroy", mode: "standard", isPreset: true, modelName: "destroy.model3.json" },
          { id: "normal", name: "Normal 模型", path: "assets/models/normal", mode: "standard", isPreset: true, modelName: "normal.model3.json" },
          { id: "naximofu_2", name: "Naximofu 2 模型", path: "assets/models/naximofu_2", mode: "standard", isPreset: true, modelName: "naximofu_2.model3.json" },
          { id: "chaijun_4", name: "Chaijun 4 模型", path: "assets/models/chaijun_4", mode: "standard", isPreset: true, modelName: "chaijun_4.model3.json" }
        ];

        const initialModels = presetModels.reduce<Record<string, Model>>((acc, model) => {
          acc[model.id] = model;
          return acc;
        }, {});

        set({
          models: initialModels,
          currentModel: Object.values(initialModels)[0],
        });
      },
      setCurrentModel: (id: string) => {
        const model = get().models[id];
        set({ currentModel: model });
      },
    }),
    {
      name: "model-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
