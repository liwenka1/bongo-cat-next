import { create } from "zustand";
import { resolveResource } from "@tauri-apps/api/path";
import {
  createLinkedModelId,
  getDirectoryName,
  loadModelsManifest,
  pickModelDirectory,
  saveModelsManifest,
  toLinkedModelConfig,
  validateLinkedModel,
  validateModelDirectory,
  type LinkModelErrorCode,
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
  pathInvalid?: boolean;
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
  errorCode?: LinkModelErrorCode;
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
  markLinkedModelInvalid: (id: string) => void;
  markLinkedModelValid: (id: string) => void;
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
    console.error("[persistModels] Failed to save manifest:", error);
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
    const selected = models[currentModelId];
    if (!selected.pathInvalid) {
      return selected;
    }
  }

  return models.standard;
}

async function applyLinkedModelValidity(models: Record<string, Model>): Promise<Record<string, Model>> {
  const entries = await Promise.all(
    Object.values(models).map(async (model) => {
      if (model.isPreset || !model.linked) {
        return [model.id, model] as const;
      }

      const validation = await validateLinkedModel(model.path, model.modelName);
      return [model.id, { ...model, pathInvalid: !validation.valid }] as const;
    })
  );

  return Object.fromEntries(entries) as Record<string, Model>;
}

function updateLinkedModelValidity(
  models: Record<string, Model>,
  id: string,
  pathInvalid: boolean
): Record<string, Model> {
  if (!(id in models)) {
    return models;
  }

  const model = models[id];
  if (model.isPreset) {
    return models;
  }

  return {
    ...models,
    [id]: {
      ...model,
      pathInvalid
    }
  };
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

    const models = await applyLinkedModelValidity({
      ...presetModels,
      ...linkedModels
    });

    const currentModel = resolveCurrentModel(models, manifest.currentModelId);

    set({ models, currentModel });

    if (manifest.currentModelId && manifest.currentModelId !== currentModel.id) {
      void persistModels(models, currentModel);
    }
  },

  linkModel: async (input) => {
    if (!isTauriRuntime()) {
      return { success: false, errorCode: "desktopOnly" };
    }

    const normalizedPath = input.path.trim();
    const validation = await validateModelDirectory(normalizedPath);
    if (!validation.valid) {
      return { success: false, errorCode: validation.errorCode ?? "noModelEntry" };
    }

    const { models } = get();
    const duplicate = Object.values(models).find(
      (model) => !model.isPreset && model.path.toLowerCase() === normalizedPath.toLowerCase()
    );
    if (duplicate) {
      return { success: false, errorCode: "alreadyLinked" };
    }

    const name = input.name?.trim() ?? getDirectoryName(normalizedPath);
    const mode = input.mode ?? "standard";
    const modelName = input.modelName ?? validation.modelName!;
    const id = createLinkedModelId(name, new Set(Object.keys(models)));

    const linkedModel: Model = {
      id,
      name,
      path: normalizedPath,
      mode,
      isPreset: false,
      modelName,
      linked: true,
      pathInvalid: false
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
        errorCode: "manifestSaveFailed",
        error: persistResult.error
      };
    }

    return { success: true, modelId: id };
  },

  linkModelFromDialog: async () => {
    if (!isTauriRuntime()) {
      return { success: false, errorCode: "desktopOnly" };
    }

    try {
      const path = await pickModelDirectory();
      if (!path) {
        return { success: false, cancelled: true };
      }

      return await get().linkModel({ path });
    } catch (error) {
      return { success: false, errorCode: "unknown", error: String(error) };
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
    const { models, currentModel: previousModel } = get();
    if (!(id in models)) {
      return;
    }

    const model = models[id];
    if (model.pathInvalid) {
      return;
    }

    set({ currentModel: model });

    // 🎯 预设模型（standard/keyboard/handle）切换无需持久化 manifest，
    //    因为 buildManifest 会过滤掉 isPreset 模型，manifest 里只存 linked 模型。
    //    对 preset 模型做 persist 是多余的，且一旦失败会导致 currentModel 回滚。
    if (model.isPreset) {
      return;
    }

    void persistModels(models, model).then((persistResult) => {
      if (!persistResult.success) {
        set({ currentModel: previousModel });
      }
    });
  },

  markLinkedModelInvalid: (id) => {
    const { models: previousModels, currentModel: previousCurrentModel } = get();
    const models = updateLinkedModelValidity(previousModels, id, true);
    const shouldFallback = previousCurrentModel?.id === id;
    const currentModel = shouldFallback ? resolveCurrentModel(models, "standard") : previousCurrentModel;

    set({ models, currentModel });

    if (shouldFallback) {
      void persistModels(models, currentModel);
    }
  },

  markLinkedModelValid: (id) => {
    set((state) => {
      const models = updateLinkedModelValidity(state.models, id, false);
      const currentModel = state.currentModel?.id === id ? models[id] : state.currentModel;

      return { models, currentModel };
    });
  }
}));
