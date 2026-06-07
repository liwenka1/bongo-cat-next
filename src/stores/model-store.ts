import { create } from "zustand";
import { resolveResource } from "@tauri-apps/api/path";
import {
  createLinkedModelId,
  getDirectoryName,
  loadModelsManifest,
  pickModelDirectory,
  saveModelsManifest,
  toLinkedModelConfig,
  validateModelDirectory,
  type ModelsManifest
} from "@/utils/model-link";
import { isTauriRuntime } from "@/utils/tauri";

export type ModelMode = "standard" | "keyboard" | "handle";

export function isInteractiveModelMode(mode: ModelMode): boolean {
  return mode === "standard" || mode === "keyboard";
}

export interface Model {
  id: string;
  name: string;
  path: string;
  mode: ModelMode;
  isPreset: boolean;
  modelName: string;
  linked?: boolean;
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

export interface LinkModelInput {
  path: string;
  name?: string;
  mode?: ModelMode;
  modelName?: string;
}

export interface LinkModelResult {
  success: boolean;
  error?: string;
  modelId?: string;
  cancelled?: boolean;
}

export interface UnlinkModelResult {
  success: boolean;
  error?: string;
}

export interface ModelStoreState {
  models: Record<string, Model>;
  currentModel: Model | null;
  initializeModels: () => Promise<void>;
  linkModel: (input: LinkModelInput) => Promise<LinkModelResult>;
  linkModelFromDialog: () => Promise<LinkModelResult>;
  unlinkModel: (id: string) => Promise<UnlinkModelResult>;
  setCurrentModel: (id: string) => void;
}

const PRESET_MODELS: Omit<Model, "path">[] = [
  {
    id: "standard",
    name: "鼠标模式",
    mode: "standard",
    isPreset: true,
    modelName: "cat.model3.json"
  },
  {
    id: "keyboard",
    name: "键盘模式",
    mode: "keyboard",
    isPreset: true,
    modelName: "cat.model3.json"
  }
];

interface PersistModelsResult {
  success: boolean;
  error?: string;
}

function buildManifest(models: Record<string, Model>, currentModel: Model | null): ModelsManifest {
  return {
    models: Object.values(models)
      .filter((model) => !model.isPreset && model.linked)
      .map((model) => toLinkedModelConfig(model)),
    currentModelId: currentModel?.id
  };
}

async function persistModels(
  models: Record<string, Model>,
  currentModel: Model | null
): Promise<PersistModelsResult> {
  if (!isTauriRuntime()) {
    return { success: true };
  }

  try {
    await saveModelsManifest(buildManifest(models, currentModel));
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function resolvePresetModels(): Promise<Record<string, Model>> {
  const resolvedModels = await Promise.all(
    PRESET_MODELS.map(async (model) => ({
      ...model,
      path: isTauriRuntime() ? await resolveResource(`assets/models/${model.id}`) : `assets/models/${model.id}`
    }))
  );

  return resolvedModels.reduce<Record<string, Model>>((acc, model) => {
    acc[model.id] = model;
    return acc;
  }, {});
}

function linkedConfigToModel(config: ReturnType<typeof toLinkedModelConfig>): Model {
  return {
    id: config.id,
    name: config.name,
    path: config.path,
    mode: config.mode,
    isPreset: false,
    modelName: config.modelName,
    linked: true
  };
}

function resolveCurrentModel(models: Record<string, Model>, currentModelId?: string): Model {
  if (currentModelId && currentModelId in models) {
    return models[currentModelId];
  }

  return models.standard;
}

export const useModelStore = create<ModelStoreState>()((set, get) => ({
  models: {},
  currentModel: null,

  initializeModels: async () => {
    const presetModels = await resolvePresetModels();
    const manifest = await loadModelsManifest();

    const linkedModels = manifest.models.reduce<Record<string, Model>>((acc, config) => {
      if (config.id in presetModels) {
        return acc;
      }

      acc[config.id] = linkedConfigToModel(config);
      return acc;
    }, {});

    const models = {
      ...presetModels,
      ...linkedModels
    };

    set({
      models,
      currentModel: resolveCurrentModel(models, manifest.currentModelId)
    });
  },

  linkModel: async (input) => {
    if (!isTauriRuntime()) {
      return { success: false, error: "Linked models are only supported in the desktop app" };
    }

    const normalizedPath = input.path.trim();
    const validation = await validateModelDirectory(normalizedPath);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { models } = get();
    const duplicate = Object.values(models).find(
      (model) => !model.isPreset && model.path.toLowerCase() === normalizedPath.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: "This model directory is already linked" };
    }

    const name = input.name?.trim() ?? getDirectoryName(normalizedPath);
    const mode = input.mode ?? "handle";
    const modelName = input.modelName ?? validation.modelName!;
    const id = createLinkedModelId(name, new Set(Object.keys(models)));

    const linkedModel: Model = {
      id,
      name,
      path: normalizedPath,
      mode,
      isPreset: false,
      modelName,
      linked: true
    };

    const nextModels = {
      ...models,
      [id]: linkedModel
    };

    const previousState = {
      models: get().models,
      currentModel: get().currentModel
    };

    set({
      models: nextModels,
      currentModel: linkedModel
    });

    const persistResult = await persistModels(nextModels, linkedModel);
    if (!persistResult.success) {
      set(previousState);
      return {
        success: false,
        error: persistResult.error ?? "Failed to save model manifest"
      };
    }

    return { success: true, modelId: id };
  },

  linkModelFromDialog: async () => {
    if (!isTauriRuntime()) {
      return { success: false, error: "Linked models are only supported in the desktop app" };
    }

    try {
      const path = await pickModelDirectory();
      if (!path) {
        return { success: false, cancelled: true };
      }

      return await get().linkModel({ path });
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  unlinkModel: async (id) => {
    const { models, currentModel } = get();

    if (!(id in models)) {
      return { success: false, error: "Model not found" };
    }

    const model = models[id];

    if (model.isPreset) {
      return { success: false, error: "Preset models cannot be unlinked" };
    }

    const { [id]: _removed, ...nextModels } = models;

    const nextCurrentModel =
      currentModel?.id === id ? resolveCurrentModel(nextModels, "standard") : currentModel;

    const previousState = {
      models: get().models,
      currentModel: get().currentModel
    };

    set({
      models: nextModels,
      currentModel: nextCurrentModel
    });

    const persistResult = await persistModels(nextModels, nextCurrentModel);
    if (!persistResult.success) {
      set(previousState);
      return {
        success: false,
        error: persistResult.error ?? "Failed to save model manifest"
      };
    }

    return { success: true };
  },

  setCurrentModel: (id) => {
    const { models, currentModel } = get();
    if (!(id in models)) {
      return;
    }

    const model = models[id];
    set({ currentModel: model });

    void persistModels(models, model).then((persistResult) => {
      if (!persistResult.success) {
        set({ currentModel });
      }
    });
  }
}));
