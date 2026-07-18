import { appDataDir, BaseDirectory, join as pathJoin } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { exists, mkdir, readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
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
  errorCode?: ModelValidationErrorCode;
  modelName?: string;
}

export type ModelValidationErrorCode =
  | "emptyPath"
  | "directoryNotFound"
  | "noModelEntry"
  | "entryNotFound"
  | "entryUnreadable";

export type LinkModelErrorCode =
  | ModelValidationErrorCode
  | "alreadyLinked"
  | "desktopOnly"
  | "manifestSaveFailed"
  | "unknown";

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
    // 🎯 确保 AppData 目录存在（Tauri 不会自动创建，首次写入前需要手动 mkdir）
    await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
    const content = `${JSON.stringify(payload, null, 2)}\n`;
    await writeTextFile(MANIFEST_FILE_NAME, content, {
      baseDir: BaseDirectory.AppData
    });
  } catch (error) {
    console.error("[saveModelsManifest] writeTextFile failed:", error);
    throw new Error(`Failed to save models manifest: ${String(error)}`);
  }
}

export async function pickModelDirectory(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  const selected = await open({
    directory: true,
    multiple: false
  });

  return typeof selected === "string" ? selected : null;
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

export async function validateLinkedModel(
  path: string,
  modelName: string
): Promise<ModelDirectoryValidationResult> {
  if (!path.trim()) {
    return { valid: false, errorCode: "emptyPath" };
  }

  if (!(await exists(path))) {
    return { valid: false, errorCode: "directoryNotFound" };
  }

  const entryPath = join(path, modelName);
  if (!(await exists(entryPath))) {
    return { valid: false, errorCode: "entryNotFound" };
  }

  try {
    await readTextFile(entryPath);
  } catch {
    return { valid: false, errorCode: "entryUnreadable" };
  }

  return { valid: true, modelName };
}

export async function validateModelDirectory(directoryPath: string): Promise<ModelDirectoryValidationResult> {
  if (!directoryPath.trim()) {
    return { valid: false, errorCode: "emptyPath" };
  }

  if (!(await exists(directoryPath))) {
    return { valid: false, errorCode: "directoryNotFound" };
  }

  const modelName = await detectModelEntryFile(directoryPath);
  if (!modelName) {
    return { valid: false, errorCode: "noModelEntry" };
  }

  return validateLinkedModel(directoryPath, modelName);
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
