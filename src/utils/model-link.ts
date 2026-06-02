import { appDataDir, BaseDirectory, join as pathJoin } from "@tauri-apps/api/path";
import { exists, readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@/utils/path";
import { isTauriRuntime } from "@/utils/tauri";
import type { ModelMode } from "@/stores/model-store";

export const MANIFEST_FILE_NAME = "models.json";

export const RESERVED_PRESET_MODEL_IDS = new Set(["standard", "keyboard"]);

export interface LinkedModelConfig {
  id: string;
  name: string;
  path: string;
  mode: ModelMode;
  modelName: string;
  isPreset: false;
  linked: true;
}

export interface ModelsManifest {
  models: LinkedModelConfig[];
  currentModelId?: string;
}

export interface ModelDirectoryValidationResult {
  valid: boolean;
  error?: string;
  modelName?: string;
}

const EMPTY_MANIFEST: ModelsManifest = { models: [] };

function isValidModelMode(mode: string): mode is ModelMode {
  return mode === "standard" || mode === "keyboard" || mode === "handle";
}

function isValidLinkedModelConfig(model: unknown): model is LinkedModelConfig {
  if (!model || typeof model !== "object") {
    return false;
  }

  const entry = model as Partial<LinkedModelConfig>;

  return (
    typeof entry.id === "string" &&
    !RESERVED_PRESET_MODEL_IDS.has(entry.id) &&
    typeof entry.name === "string" &&
    typeof entry.path === "string" &&
    typeof entry.mode === "string" &&
    isValidModelMode(entry.mode) &&
    typeof entry.modelName === "string" &&
    entry.isPreset === false &&
    entry.linked === true
  );
}

export async function getModelsManifestPath(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  return pathJoin(await appDataDir(), MANIFEST_FILE_NAME);
}

export async function loadModelsManifest(): Promise<ModelsManifest> {
  if (!isTauriRuntime()) {
    return { ...EMPTY_MANIFEST };
  }

  try {
    const manifestExists = await exists(MANIFEST_FILE_NAME, { baseDir: BaseDirectory.AppData });
    if (!manifestExists) {
      return { ...EMPTY_MANIFEST };
    }

    const content = await readTextFile(MANIFEST_FILE_NAME, { baseDir: BaseDirectory.AppData });
    const parsed: unknown = JSON.parse(content);

    if (typeof parsed !== "object" || parsed === null || !("models" in parsed) || !Array.isArray(parsed.models)) {
      return { ...EMPTY_MANIFEST };
    }

    const linkedModels = parsed.models.filter(isValidLinkedModelConfig);

    return {
      models: linkedModels,
      currentModelId:
        typeof (parsed as Partial<ModelsManifest>).currentModelId === "string"
          ? (parsed as Partial<ModelsManifest>).currentModelId
          : undefined
    };
  } catch {
    return { ...EMPTY_MANIFEST };
  }
}

export async function saveModelsManifest(manifest: ModelsManifest): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  const payload: ModelsManifest = {
    models: manifest.models,
    ...(manifest.currentModelId ? { currentModelId: manifest.currentModelId } : {})
  };

  try {
    await writeTextFile(MANIFEST_FILE_NAME, `${JSON.stringify(payload, null, 2)}\n`, {
      baseDir: BaseDirectory.AppData
    });
  } catch (error) {
    throw new Error(`Failed to save models manifest: ${String(error)}`);
  }
}

export async function detectModelEntryFiles(directoryPath: string): Promise<string[]> {
  if (!(await exists(directoryPath))) {
    return [];
  }

  const entries = await readDir(directoryPath);

  return entries
    .filter((entry) => entry.isFile && entry.name.endsWith(".model3.json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function detectModelEntryFile(directoryPath: string): Promise<string | null> {
  const files = await detectModelEntryFiles(directoryPath);
  return files[0] ?? null;
}

export async function validateModelDirectory(directoryPath: string): Promise<ModelDirectoryValidationResult> {
  if (!directoryPath.trim()) {
    return { valid: false, error: "Model directory path is empty" };
  }

  if (!(await exists(directoryPath))) {
    return { valid: false, error: "Model directory does not exist" };
  }

  const modelName = await detectModelEntryFile(directoryPath);
  if (!modelName) {
    return { valid: false, error: "No Cubism 4 model entry (.model3.json) found in directory" };
  }

  const entryPath = join(directoryPath, modelName);
  try {
    await readTextFile(entryPath);
  } catch {
    return { valid: false, error: "Model entry file is not readable" };
  }

  return { valid: true, modelName };
}

export function getDirectoryName(directoryPath: string): string {
  const parts = directoryPath.split(/[/\\]/).filter(Boolean);
  return parts.at(-1) ?? "Custom Model";
}

export function createLinkedModelId(name: string, existingIds: Set<string>): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "linked-model";

  let candidate = base;
  let suffix = 1;

  while (existingIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function toLinkedModelConfig(model: {
  id: string;
  name: string;
  path: string;
  mode: ModelMode;
  modelName: string;
}): LinkedModelConfig {
  return {
    id: model.id,
    name: model.name,
    path: model.path,
    mode: model.mode,
    modelName: model.modelName,
    isPreset: false,
    linked: true
  };
}
