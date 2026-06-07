import { useCallback } from "react";
import { CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { useI18n } from "@/hooks/use-i18n";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { toast } from "sonner";

/**
 * 🎯 共享菜单构建器 Hook
 *
 * 职责：
 * - 提供所有菜单项的构建函数
 * - 避免在托盘和右键菜单间重复代码
 * - 统一菜单逻辑和状态管理
 */
export function _useMenuBuilder() {
  // 使用统一的 useI18n Hook
  const { t, changeLanguage, isLanguage } = useI18n(["menu", "window", "models", "system"]);

  const {
    scale,
    setScale,
    opacity,
    setOpacity,
    penetrable,
    setPenetrable,
    alwaysOnTop,
    setAlwaysOnTop,
    mirrorMode,
    setMirrorMode,
    selectorsVisible,
    setSelectorsVisible
  } = useCatStore();
  const { models, currentModel, setCurrentModel, linkModelFromDialog, unlinkModel } = useModelStore();

  const handleLinkModel = useCallback(async () => {
    const result = await linkModelFromDialog();
    if (result.cancelled) {
      return;
    }

    if (!result.success) {
      toast.error(result.error ?? t("linkFailed", { ns: "models" }));
      return;
    }

    toast.success(t("linkSuccess", { ns: "models" }));
  }, [linkModelFromDialog, t]);

  const handleUnlinkModel = useCallback(
    async (id: string) => {
      const result = await unlinkModel(id);
      if (!result.success) {
        toast.error(result.error ?? t("unlinkFailed", { ns: "models" }));
        return;
      }

      toast.success(t("unlinkSuccess", { ns: "models" }));
    },
    [unlinkModel, t]
  );

  // 🎯 创建缩放选项子菜单
  const getScaleMenuItems = useCallback(async () => {
    const scaleOptions = [50, 75, 100, 125, 150];
    const currentScale = scale;

    const items = await Promise.all(
      scaleOptions.map(async (scaleValue) => {
        return await CheckMenuItem.new({
          text: scaleValue === 100 ? t("scale.default", { ns: "menu" }) : `${scaleValue}%`,
          checked: currentScale === scaleValue,
          action: () => {
            setScale(scaleValue);
          }
        });
      })
    );

    // 如果当前缩放不在预设选项中，添加自定义选项
    if (!scaleOptions.includes(currentScale)) {
      const customItem = await CheckMenuItem.new({
        text: `${currentScale}%`,
        checked: true,
        enabled: false
      });
      items.unshift(customItem);
    }

    return items;
  }, [scale, setScale, t]);

  // 🎯 创建透明度选项子菜单
  const getOpacityMenuItems = useCallback(async () => {
    const opacityOptions = [25, 50, 75, 100];

    const items = await Promise.all(
      opacityOptions.map(async (opacityValue) => {
        return await CheckMenuItem.new({
          text: `${opacityValue}%`,
          checked: opacity === opacityValue,
          action: () => {
            setOpacity(opacityValue);
          }
        });
      })
    );

    // 如果当前透明度不在预设选项中，添加自定义选项
    if (!opacityOptions.includes(opacity)) {
      const customItem = await CheckMenuItem.new({
        text: `${opacity}%`,
        checked: true,
        enabled: false
      });
      items.unshift(customItem);
    }

    return items;
  }, [opacity, setOpacity]);

  // 🎯 创建模型模式选项子菜单
  const getModeMenuItems = useCallback(async () => {
    const items = [
      await MenuItem.new({
        text: t("linkModel", { ns: "models" }),
        action: () => {
          void handleLinkModel();
        }
      }),
      await PredefinedMenuItem.new({ item: "Separator" }),
      ...(await Promise.all(
        Object.values(models).map(async (model) => {
          return await CheckMenuItem.new({
            text: model.isPreset ? t(`names.${model.id}`, { ns: "models" }) : model.name,
            checked: currentModel?.id === model.id,
            action: () => {
              setCurrentModel(model.id);
            }
          });
        })
      ))
    ];

    const linkedModels = Object.values(models).filter((model) => !model.isPreset);
    if (linkedModels.length > 0) {
      items.push(await PredefinedMenuItem.new({ item: "Separator" }));
      items.push(
        ...(await Promise.all(
          linkedModels.map(async (model) => {
            return await MenuItem.new({
              text: t("unlinkModel", { ns: "models", name: model.name }),
              action: () => {
                void handleUnlinkModel(model.id);
              }
            });
          })
        ))
      );
    }

    return items;
  }, [models, currentModel, setCurrentModel, handleLinkModel, handleUnlinkModel, t]);

  // 🎯 创建模型模式子菜单
  const createModeSubmenu = useCallback(async () => {
    return await Submenu.new({
      text: t("title", { ns: "models" }),
      items: await getModeMenuItems()
    });
  }, [getModeMenuItems, t]);

  // 🎯 创建窗口穿透菜单项
  const createPenetrableMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: t("penetrable", { ns: "window" }),
      checked: penetrable,
      action: () => {
        setPenetrable(!penetrable);
      }
    });
  }, [penetrable, setPenetrable, t]);

  // 🎯 创建始终置顶菜单项
  const createAlwaysOnTopMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: t("alwaysOnTop", { ns: "window" }),
      checked: alwaysOnTop,
      action: () => {
        setAlwaysOnTop(!alwaysOnTop);
      }
    });
  }, [alwaysOnTop, setAlwaysOnTop, t]);

  // 🎯 创建镜像模式菜单项
  const createMirrorModeMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: t("mirrorMode", { ns: "window" }),
      checked: mirrorMode,
      action: () => {
        setMirrorMode(!mirrorMode);
      }
    });
  }, [mirrorMode, setMirrorMode, t]);

  // 🎯 创建窗口尺寸子菜单
  const createScaleSubmenu = useCallback(async () => {
    return await Submenu.new({
      text: t("scale.title", { ns: "menu" }),
      items: await getScaleMenuItems()
    });
  }, [getScaleMenuItems, t]);

  // 🎯 创建不透明度子菜单
  const createOpacitySubmenu = useCallback(async () => {
    return await Submenu.new({
      text: t("opacity.title", { ns: "menu" }),
      items: await getOpacityMenuItems()
    });
  }, [getOpacityMenuItems, t]);

  // 🎯 创建显示/隐藏选择器菜单项
  const createSelectorsVisibilityMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: t("showSelectors", { ns: "window" }),
      checked: selectorsVisible,
      action: () => {
        setSelectorsVisible(!selectorsVisible);
      }
    });
  }, [selectorsVisible, setSelectorsVisible, t]);

  // 🎯 创建语言选择子菜单
  const createLanguageSubmenu = useCallback(async () => {
    const languageItems = await Promise.all([
      CheckMenuItem.new({
        text: t("language.chinese", { ns: "system" }),
        checked: isLanguage("zh-CN"),
        action: () => {
          void changeLanguage("zh-CN");
        }
      }),
      CheckMenuItem.new({
        text: t("language.english", { ns: "system" }),
        checked: isLanguage("en-US"),
        action: () => {
          void changeLanguage("en-US");
        }
      })
    ]);

    return await Submenu.new({
      text: t("language.title", { ns: "system" }),
      items: languageItems
    });
  }, [t, isLanguage, changeLanguage]);

  return {
    // 子菜单构建函数
    getScaleMenuItems,
    getOpacityMenuItems,
    getModeMenuItems,

    // 预构建的菜单项和子菜单
    createModeSubmenu,
    createPenetrableMenuItem,
    createAlwaysOnTopMenuItem,
    createMirrorModeMenuItem,
    createScaleSubmenu,
    createOpacitySubmenu,
    createSelectorsVisibilityMenuItem,
    createLanguageSubmenu,

    // 状态对象（用于依赖监听）
    menuStates: {
      scale,
      opacity,
      penetrable,
      alwaysOnTop,
      mirrorMode,
      selectorsVisible,
      models,
      currentModel
    }
  };
}
