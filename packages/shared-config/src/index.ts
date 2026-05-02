import type { AllowedApp, AllowedCommand, AppSettings, MemoryProfile, PermissionSettings } from "@my-pet/shared-types";

export const APP_NAME = "BongoCat";
export const AGENT_SERVICE_PORT = 4343;
export const AGENT_SERVICE_URL = `http://127.0.0.1:${AGENT_SERVICE_PORT}`;
export const WORKSPACE_ALIAS = "workspace";

export const ALLOWED_APPS: AllowedApp[] = [
  {
    id: "vs-code",
    label: "VS Code",
    aliases: ["vs code", "vscode", "code", "visual studio code"]
  },
  {
    id: "browser",
    label: "Browser",
    aliases: ["browser", "edge", "chrome", "firefox", "浏览器"]
  },
  {
    id: "notepad",
    label: "Notepad",
    aliases: ["notepad", "记事本"]
  }
];

export const ALLOWED_COMMANDS: AllowedCommand[] = [
  {
    id: "show_date",
    label: "Show Date",
    description: "Display the current system date and time.",
    risk: "low"
  },
  {
    id: "list_workspace",
    label: "List Workspace",
    description: "List files from the current workspace root.",
    risk: "low"
  },
  {
    id: "git_status",
    label: "Git Status",
    description: "Show the current git status for the workspace.",
    risk: "low"
  },
  {
    id: "whoami",
    label: "Who Am I",
    description: "Show the current operating system user.",
    risk: "low"
  }
];

export const DEFAULT_PERMISSIONS: PermissionSettings = {
  allowedApps: ALLOWED_APPS.map((app) => app.id),
  allowedDirectories: [WORKSPACE_ALIAS],
  allowedCommands: ALLOWED_COMMANDS.map((command) => command.id),
  dangerousActionConfirmation: true
};

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    launchOnStartup: false,
    enableTray: true,
    language: "zh-CN",
    assistantHotkey: "Alt+Shift+B"
  },
  pet: {
    opacity: 92,
    mirrorMode: false,
    alwaysOnTop: true,
    clickThrough: false,
    modelId: "ink_cat"
  },
  ai: {
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "",
    codexEnabled: false,
    codexModel: "",
    serviceUrl: AGENT_SERVICE_URL
  },
  permissions: DEFAULT_PERMISSIONS
};

export const DEFAULT_MEMORY: MemoryProfile = {
  nickname: "朋友",
  preferences: ["偏好中文交流", "希望先确认高风险操作"],
  favoriteProjectPaths: []
};

export const DEFAULT_TASKS = [];
