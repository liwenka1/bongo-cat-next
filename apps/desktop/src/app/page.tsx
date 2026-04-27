"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PlannedToolCall, SettingsBundle, ToolExecutionResult } from "@my-pet/shared-types";
import { getMemoryProfileFromAgent, getOperationLogs, getServiceHealth, getTasks, sendChat, updateTaskEvent } from "@/services/agent-client";
import { loadSettingsBundle } from "@/services/settings-client";
import {
  fileSearch,
  getPetAppStatus,
  launchPetApp,
  openApp,
  openUrl,
  revealPetApp,
  runCommand,
  showSettingsWindow,
  stopPetApp,
  type ExternalPetAppStatus
} from "@/services/tauri-client";
import { useAssistantStore } from "@/stores/assistant-store";
import { isTauriRuntime } from "@/utils/tauri";

const ManagerOverview = dynamic(
  async () => (await import("@/features/manager/manager-overview")).ManagerOverview,
  {
    loading: () => <CardSkeleton label="Manager" title="正在加载管理面板" lines={3} />
  }
);

const ChatPanel = dynamic(async () => (await import("@/features/chat/chat-panel")).ChatPanel, {
  loading: () => <CardSkeleton label="Assistant" title="正在加载聊天面板" lines={5} />
});

const TasksPanel = dynamic(async () => (await import("@/features/tasks/tasks-panel")).TasksPanel, {
  loading: () => <CardSkeleton label="Tasks" title="正在加载任务面板" lines={6} />
});

const PermissionDialog = dynamic(
  async () => (await import("@/features/permissions/permission-dialog")).PermissionDialog
);

function getProjectName(projectPath: string) {
  const normalized = projectPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments.at(-1) ?? projectPath;
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      resolve();
    });
  });
}

function CardSkeleton({
  label,
  title,
  lines
}: {
  label: string;
  title: string;
  lines: number;
}) {
  return (
    <section className="manager-panel rounded-[2rem] p-5">
      <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/65">{label}</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`${label}-${index}`}
            className="h-12 animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] gap-4 xl:grid-cols-[1.15fr_0.95fr]">
      <div className="flex min-h-full flex-col gap-4">
        <CardSkeleton label="Manager" title="正在准备管理端" lines={4} />
        <CardSkeleton label="Status" title="正在检查服务和桌宠进程" lines={5} />
      </div>
      <div className="flex min-h-full flex-col gap-4">
        <CardSkeleton label="Assistant" title="正在加载聊天模块" lines={5} />
        <CardSkeleton label="Tasks" title="正在加载任务与审计模块" lines={7} />
      </div>
    </div>
  );
}

function StartupOverlay({
  progress,
  message
}: {
  progress: number;
  message: string;
}) {
  return (
        <div className="manager-overlay fixed inset-0 z-50 flex items-center justify-center">
      <div className="manager-panel w-full max-w-xl rounded-[2rem] p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Startup</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">正在启动管理端</h2>
        <p className="mt-2 text-sm text-slate-300">{message}</p>

        <div className="mt-6 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-[linear-gradient(90deg,#67e8f9,#86efac,#fcd34d)] transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>首次启动会检查本地设置、服务状态和桌宠进程。</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [petAppStatus, setPetAppStatus] = useState<ExternalPetAppStatus | null>(null);
  const [isRefreshingPetApp, setIsRefreshingPetApp] = useState(false);
  const [bootstrapProgress, setBootstrapProgress] = useState(8);
  const [bootstrapMessage, setBootstrapMessage] = useState("正在准备管理端界面...");
  const {
    permissions,
    settings,
    messages,
    tasks,
    logs,
    memory,
    isBootstrapping,
    isSending,
    serviceReachable,
    pendingAction,
    pendingTaskId,
    setBootstrapState,
    setSendingState,
    setHealth,
    setTasks,
    setLogs,
    setMemory,
    setSettingsBundle,
    addMessage,
    addUserMessage,
    setServiceReachable,
    upsertTask,
    setPendingAction
  } = useAssistantStore();

  const refreshServiceState = async () => {
    const [healthResult, tasksResult, logsResult, memoryResult] = await Promise.allSettled([
      getServiceHealth(),
      getTasks(),
      getOperationLogs(12),
      getMemoryProfileFromAgent()
    ]);

    setHealth(healthResult.status === "fulfilled" ? healthResult.value : null);

    if (tasksResult.status === "fulfilled") {
      setTasks(tasksResult.value);
    }

    if (logsResult.status === "fulfilled") {
      setLogs(logsResult.value);
    }

    if (memoryResult.status === "fulfilled") {
      setMemory(memoryResult.value);
    }

    setServiceReachable(
      [healthResult, tasksResult, logsResult, memoryResult].some((result) => result.status === "fulfilled")
    );
  };

  const refreshPetStatus = async ({
    showErrorToast = false,
    showSpinner = true
  }: {
    showErrorToast?: boolean;
    showSpinner?: boolean;
  } = {}) => {
    if (!isTauriRuntime()) {
      return;
    }

    if (showSpinner) {
      setIsRefreshingPetApp(true);
    }

    try {
      const status = await getPetAppStatus();
      setPetAppStatus(status);
    } catch (error) {
      if (showErrorToast) {
        toast.error(`刷新桌宠状态失败：${String(error)}`);
      }
    } finally {
      if (showSpinner) {
        setIsRefreshingPetApp(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const setBootstrapStep = async (progress: number, message: string) => {
      if (cancelled) {
        return;
      }

      setBootstrapProgress(progress);
      setBootstrapMessage(message);
      await waitForNextPaint();
    };

    const bootstrap = async () => {
      await setBootstrapStep(16, "读取本地设置...");

      try {
        const bundle = await loadSettingsBundle();
        if (cancelled) {
          return;
        }

        setSettingsBundle(bundle.settings, bundle.permissions);
      } catch (error) {
        toast.error(`初始化设置失败：${String(error)}`);
      }

      await setBootstrapStep(44, "检查本地 agent-service...");
      await refreshServiceState();

      if (isTauriRuntime()) {
        await setBootstrapStep(72, "检查桌宠进程状态...");
        await refreshPetStatus({ showSpinner: false });
      }

      await setBootstrapStep(92, "加载管理面板...");
      await waitForNextPaint();

      await setBootstrapStep(100, "启动完成");
      window.setTimeout(() => {
        if (!cancelled) {
          setBootstrapState(false);
        }
      }, 180);
    };

    const bootstrapTimer = window.setTimeout(() => {
      void bootstrap();
    }, 30);

    return () => {
      cancelled = true;
      window.clearTimeout(bootstrapTimer);
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshServiceState();
    }, 12000);

    const handleResumeRefresh = () => {
      if (document.visibilityState === "visible") {
        void refreshServiceState();
      }
    };

    window.addEventListener("focus", handleResumeRefresh);
    document.addEventListener("visibilitychange", handleResumeRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleResumeRefresh);
      document.removeEventListener("visibilitychange", handleResumeRefresh);
    };
  }, [isBootstrapping, settings.ai.serviceUrl]);

  useEffect(() => {
    if (!isTauriRuntime() || isBootstrapping) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshPetStatus({ showSpinner: false });
    }, 12000);

    const handleResumeRefresh = () => {
      if (document.visibilityState === "visible") {
        void refreshPetStatus({ showSpinner: false });
      }
    };

    window.addEventListener("focus", handleResumeRefresh);
    document.addEventListener("visibilitychange", handleResumeRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleResumeRefresh);
      document.removeEventListener("visibilitychange", handleResumeRefresh);
    };
  }, [isBootstrapping]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let cleanup: (() => void) | undefined;

    const bind = async () => {
      const { listen } = await import("@tauri-apps/api/event");
      cleanup = await listen<SettingsBundle>("settings-updated", ({ payload }) => {
        setSettingsBundle(payload.settings, payload.permissions);
        toast.success("管理端设置已同步。");
      });
    };

    void bind();

    return () => {
      cleanup?.();
    };
  }, []);

  const handleLaunchPetApp = async () => {
    try {
      const status = await launchPetApp();
      setPetAppStatus(status);
      toast.success(status.running ? "桌宠程序已启动。" : status.message);
    } catch (error) {
      toast.error(`启动桌宠失败：${String(error)}`);
    }
  };

  const handleStopPetApp = async () => {
    try {
      const status = await stopPetApp();
      setPetAppStatus(status);
      toast.success("桌宠程序已停止。");
    } catch (error) {
      toast.error(`停止桌宠失败：${String(error)}`);
    }
  };

  const handleRevealPetApp = async () => {
    try {
      await revealPetApp();
    } catch (error) {
      toast.error(`定位桌宠程序失败：${String(error)}`);
    }
  };

  const runAction = async (action: PlannedToolCall): Promise<ToolExecutionResult> => {
    switch (action.tool) {
      case "open_app":
        return openApp(action.payload.appName);
      case "open_url":
        return openUrl(action.payload.url);
      case "run_command":
        return runCommand(action.payload.commandId, action.payload.args);
      case "file_search":
        return fileSearch(action.payload.baseDir, action.payload.keyword);
      default:
        throw new Error("Unsupported tool");
    }
  };

  const executeAction = async (action: PlannedToolCall, taskId: string | null = null) => {
    if (!isTauriRuntime() && action.tool !== "open_url") {
      toast.info("当前 Web 预览不执行本地桌面动作，请在管理端应用内使用。");
      return;
    }

    const requiresConfirmation =
      permissions.dangerousActionConfirmation && (action.requiresConfirmation || action.risk !== "low");

    if (requiresConfirmation) {
      setPendingAction(action, taskId);
      return;
    }

    try {
      const result = await runAction(action);
      toast.success(result.summary);

      if (taskId) {
        const task = await updateTaskEvent(taskId, { status: "completed", result: result.summary });
        if (task) {
          upsertTask(task);
        }
      }

      void refreshServiceState();
    } catch (error) {
      const detail = String(error);
      toast.error(detail);

      if (taskId) {
        const task = await updateTaskEvent(taskId, { status: "failed", error: detail });
        if (task) {
          upsertTask(task);
        }
      }
    }
  };

  const handleSend = async (content: string) => {
    const userMessage = addUserMessage(content);
    setSendingState(true);

    try {
      const response = await sendChat({
        message: content,
        conversation: [...messages, userMessage]
      });

      addMessage(response.reply);
      setTasks(response.tasks.concat(tasks).slice(0, 20));
      setServiceReachable(true);
      void refreshServiceState();
    } catch (error) {
      setServiceReachable(false);
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `当前无法连接本地 agent-service。你可以先运行 \`pnpm dev:agent\`，或使用下方快捷动作。错误信息：${String(
          error
        )}`,
        createdAt: new Date().toISOString()
      });
    } finally {
      setSendingState(false);
    }
  };

  const favoriteSearchPath = memory.favoriteProjectPaths.find((projectPath) =>
    permissions.allowedDirectories.includes(projectPath)
  );

  const favoriteQuickActions: {
    id: string;
    title: string;
    description: string;
    action: PlannedToolCall;
  }[] = favoriteSearchPath
    ? [
        {
          id: "quick-search-favorite-project",
          title: `搜索 ${getProjectName(favoriteSearchPath)}`,
          description: "使用记忆中的常用项目路径执行一次文件搜索。",
          action: {
            id: "quick-search-favorite-project",
            tool: "file_search",
            title: `在 ${getProjectName(favoriteSearchPath)} 中搜索 README`,
            rationale: "优先验证记忆里的常用项目路径是否仍然可用。",
            risk: "low",
            requiresConfirmation: false,
            payload: {
              baseDir: favoriteSearchPath,
              keyword: "README"
            }
          }
        }
      ]
    : [];

  const quickActions: {
    id: string;
    title: string;
    description: string;
    action: PlannedToolCall;
  }[] = [
    {
      id: "quick-open-code",
      title: "打开 VS Code",
      description: "直接启动本地编辑器。",
      action: {
        id: "quick-open-code",
        tool: "open_app",
        title: "打开 VS Code",
        rationale: "快速进入代码编辑环境。",
        risk: "medium",
        requiresConfirmation: true,
        payload: {
          appName: "vs-code"
        }
      }
    },
    {
      id: "quick-open-platform",
      title: "打开 OpenAI Platform",
      description: "验证浏览器启动和 URL 打开能力。",
      action: {
        id: "quick-open-platform",
        tool: "open_url",
        title: "打开 OpenAI Platform",
        rationale: "浏览器打开属于低风险动作。",
        risk: "low",
        requiresConfirmation: false,
        payload: {
          url: "https://platform.openai.com"
        }
      }
    },
    {
      id: "quick-git-status",
      title: "执行 git status",
      description: "验证 PowerShell 白名单命令桥。",
      action: {
        id: "quick-git-status",
        tool: "run_command",
        title: "执行 git status",
        rationale: "只运行白名单内的命令映射。",
        risk: "low",
        requiresConfirmation: true,
        payload: {
          commandId: "git_status",
          args: []
        }
      }
    },
    {
      id: "quick-search-readme",
      title: "搜索 README",
      description: "验证工作区文件搜索能力。",
      action: {
        id: "quick-search-readme",
        tool: "file_search",
        title: "搜索 README",
        rationale: "只在允许目录别名 workspace 内执行搜索。",
        risk: "low",
        requiresConfirmation: false,
        payload: {
          baseDir: "workspace",
          keyword: "README"
        }
      }
    },
    ...favoriteQuickActions
  ];

  return (
    <>
      <main className="manager-shell min-h-screen px-4 py-4 text-slate-100">
        {isBootstrapping ? (
          <DashboardSkeleton />
        ) : (
          <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1560px] gap-4 xl:grid-cols-[1.15fr_0.95fr]">
            <ManagerOverview
              serviceReachable={serviceReachable}
              serviceUrl={settings.ai.serviceUrl}
              petAppStatus={petAppStatus}
              isRefreshingPetApp={isRefreshingPetApp}
              onRefreshPetApp={() => {
                void refreshPetStatus({ showErrorToast: true });
              }}
              onLaunchPetApp={() => {
                void handleLaunchPetApp();
              }}
              onStopPetApp={() => {
                void handleStopPetApp();
              }}
              onRevealPetApp={() => {
                void handleRevealPetApp();
              }}
              onOpenSettings={() => {
                void showSettingsWindow();
              }}
            />

            <div className="flex min-h-full flex-col gap-4">
              <ChatPanel
                messages={messages}
                isSending={isSending}
                serviceReachable={serviceReachable}
                onSend={handleSend}
                onExecuteAction={(action) => {
                  const relatedTask = tasks.find((task) => task.toolCall?.id === action.id);
                  void executeAction(action, relatedTask?.id ?? null);
                }}
                onOpenSettings={() => {
                  void showSettingsWindow();
                }}
              />

              <TasksPanel
                tasks={tasks}
                logs={logs}
                memory={memory}
                quickActions={quickActions}
                onRunQuickAction={(action) => {
                  void executeAction(action);
                }}
                onRefresh={async () => {
                  await refreshServiceState();
                }}
              />
            </div>
          </div>
        )}
      </main>

      {isBootstrapping && <StartupOverlay progress={bootstrapProgress} message={bootstrapMessage} />}

      <PermissionDialog
        action={pendingAction}
        isOpen={pendingAction !== null}
        onCancel={() => {
          setPendingAction(null, null);
        }}
        onConfirm={async () => {
          if (!pendingAction) {
            return;
          }

          try {
            const result = await runAction(pendingAction);
            toast.success(result.summary);

            if (pendingTaskId) {
              const task = await updateTaskEvent(
                pendingTaskId,
                {
                  status: "completed",
                  result: result.summary
                }
              );
              if (task) {
                upsertTask(task);
              }
            }
          } catch (error) {
            const detail = String(error);
            toast.error(detail);

            if (pendingTaskId) {
              const task = await updateTaskEvent(
                pendingTaskId,
                {
                  status: "failed",
                  error: detail
                }
              );
              if (task) {
                upsertTask(task);
              }
            }
          } finally {
            setPendingAction(null, null);
            void refreshServiceState();
          }
        }}
      />
    </>
  );
}
