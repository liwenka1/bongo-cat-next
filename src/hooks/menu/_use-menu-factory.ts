import { useCallback } from "react";
import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { useTranslation } from "react-i18next";
import { useCatStore } from "@/stores/cat-store";
import { _useMenuBuilder } from "@/hooks/menu/_use-menu-builder";
import { exit } from "@tauri-apps/plugin-process";
import { toast } from "sonner";

export type MenuType = "context" | "tray";

export interface MenuOptions {
  type: MenuType;
  includeAppInfo?: boolean; // 是否包含应用信息（版本、开源链接等）
  includeAppControls?: boolean; // 是否包含应用控制（重启、退出等）
}

/**
 * 🎯 菜单工厂 Hook
 *
 * 职责：
 * - 提供统一的菜单创建接口
 * - 根据不同类型生成对应的菜单结构
 * - 高层次的菜单配置管理
 */
export function _useMenuFactory() {
  const { t } = useTranslation(["system"]);
  const { visible, setVisible } = useCatStore();
  const {
    createModeSubmenu,
    createPenetrableMenuItem,
    createAlwaysOnTopMenuItem,
    createMirrorModeMenuItem,
    createScaleSubmenu,
    createOpacitySubmenu,
    createSelectorsVisibilityMenuItem,
    createLanguageSubmenu,
    menuStates
  } = _useMenuBuilder();

  // 🎯 创建核心功能菜单项（窗口相关功能）
  const createCoreMenuItems = useCallback(async () => {
    return [
      // 模型模式子菜单
      await createModeSubmenu(),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 窗口功能组
      await createPenetrableMenuItem(),
      await createAlwaysOnTopMenuItem(),
      await createMirrorModeMenuItem(),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 窗口设置子菜单组
      await createScaleSubmenu(),
      await createOpacitySubmenu(),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 界面控制
      await createSelectorsVisibilityMenuItem()
    ];
  }, [
    createModeSubmenu,
    createPenetrableMenuItem,
    createAlwaysOnTopMenuItem,
    createMirrorModeMenuItem,
    createScaleSubmenu,
    createOpacitySubmenu,
    createSelectorsVisibilityMenuItem
  ]);

  // 🎯 创建应用信息菜单项
  const createAppInfoMenuItems = useCallback(async () => {
    const { getName, getVersion } = await import("@tauri-apps/api/app");
    const { openUrl } = await import("@tauri-apps/plugin-opener");

    const appVersion = await getVersion();

    return [
      // 开源地址
      await MenuItem.new({
        text: t("system:sourceCode"),
        action: () => void openUrl("https://github.com/liwenka1/bongo-cat-next")
      }),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 版本信息
      await MenuItem.new({
        text: `${t("system:version")} ${appVersion}`,
        enabled: false
      })
    ];
  }, []);

  // 🎯 创建应用控制菜单项
  const createAppControlMenuItems = useCallback(async () => {
    const { relaunch } = await import("@tauri-apps/plugin-process");

    return [
      // 重启应用
      await MenuItem.new({
        text: t("system:restart"),
        action: () => void relaunch()
      }),

      // 退出应用
      await MenuItem.new({
        text: t("system:quit"),
        accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
        action: () => void exit(0)
      })
    ];
  }, [t]);

  // 🎯 根据配置创建完整菜单
  const createMenu = useCallback(
    async (options: MenuOptions) => {
      const items = [];

      // 显示/隐藏猫咪 - 所有菜单都包含
      items.push(
        await MenuItem.new({
          text: visible ? t("system:hideCat") : t("system:showCat"),
          action: () => {
            setVisible(!visible);
          }
        }),
        await PredefinedMenuItem.new({ item: "Separator" })
      );

      // 核心功能菜单项 - 所有菜单都包含
      items.push(...(await createCoreMenuItems()));

      // 根据类型添加不同的额外功能
      switch (options.type) {
        case "tray":
          // 语言选择 - 托盘菜单包含
          items.push(await PredefinedMenuItem.new({ item: "Separator" }), await createLanguageSubmenu());

          // 托盘菜单默认包含应用信息和控制
          if (options.includeAppInfo !== false) {
            items.push(await PredefinedMenuItem.new({ item: "Separator" }), ...(await createAppInfoMenuItems()));
          }

          if (options.includeAppControls !== false) {
            items.push(await PredefinedMenuItem.new({ item: "Separator" }), ...(await createAppControlMenuItems()));
          }
          break;

        case "context":
          // 语言选择 - 右键菜单也包含
          items.push(await PredefinedMenuItem.new({ item: "Separator" }), await createLanguageSubmenu());

          // 右键菜单只包含基础的退出功能
          items.push(
            await PredefinedMenuItem.new({ item: "Separator" }),
            await MenuItem.new({
              text: t("system:quit"),
              action: () => void exit(0)
            })
          );
          break;
      }

      return await Menu.new({ items });
    },
    [
      visible,
      setVisible,
      createCoreMenuItems,
      createLanguageSubmenu,
      createAppInfoMenuItems,
      createAppControlMenuItems,
      t
    ]
  );

  // 🎯 显示菜单的统一方法
  const showMenu = useCallback(
    async (options: MenuOptions) => {
      try {
        const menu = await createMenu(options);

        if (options.type === "context") {
          await menu.popup();
        }

        return menu;
      } catch (error) {
        toast.error(`Failed to show ${options.type} menu: ${String(error)}`);
      }
    },
    [createMenu]
  );

  return {
    // 高级封装方法
    createMenu,
    showMenu,

    // 状态对象
    menuStates: {
      visible,
      ...menuStates
    }
  };
}
