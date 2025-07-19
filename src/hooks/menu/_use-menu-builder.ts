import { useCallback } from "react";
import { CheckMenuItem, Submenu } from "@tauri-apps/api/menu";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";

/**
 * 🎯 共享菜单构建器 Hook
 *
 * 职责：
 * - 提供所有菜单项的构建函数
 * - 避免在托盘和右键菜单间重复代码
 * - 统一菜单逻辑和状态管理
 */
export function _useMenuBuilder() {
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
  const { models, currentModel, setCurrentModel } = useModelStore();

  // 🎯 创建缩放选项子菜单
  const getScaleMenuItems = useCallback(async () => {
    const scaleOptions = [50, 75, 100, 125, 150];
    const currentScale = scale;

    const items = await Promise.all(
      scaleOptions.map(async (scaleValue) => {
        return await CheckMenuItem.new({
          text: scaleValue === 100 ? "默认" : `${scaleValue}%`,
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
  }, [scale, setScale]);

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
    return await Promise.all(
      Object.values(models).map(async (model) => {
        return await CheckMenuItem.new({
          text: model.name,
          checked: currentModel?.id === model.id,
          action: () => {
            setCurrentModel(model.id);
          }
        });
      })
    );
  }, [models, currentModel, setCurrentModel]);

  // 🎯 创建模型模式子菜单
  const createModeSubmenu = useCallback(async () => {
    return await Submenu.new({
      text: "模型模式",
      items: await getModeMenuItems()
    });
  }, [getModeMenuItems]);

  // 🎯 创建窗口穿透菜单项
  const createPenetrableMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: "窗口穿透",
      checked: penetrable,
      action: () => {
        setPenetrable(!penetrable);
      }
    });
  }, [penetrable, setPenetrable]);

  // 🎯 创建始终置顶菜单项
  const createAlwaysOnTopMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: "始终置顶",
      checked: alwaysOnTop,
      action: () => {
        setAlwaysOnTop(!alwaysOnTop);
      }
    });
  }, [alwaysOnTop, setAlwaysOnTop]);

  // 🎯 创建镜像模式菜单项
  const createMirrorModeMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: "镜像模式",
      checked: mirrorMode,
      action: () => {
        setMirrorMode(!mirrorMode);
      }
    });
  }, [mirrorMode, setMirrorMode]);

  // 🎯 创建窗口尺寸子菜单
  const createScaleSubmenu = useCallback(async () => {
    return await Submenu.new({
      text: "窗口尺寸",
      items: await getScaleMenuItems()
    });
  }, [getScaleMenuItems]);

  // 🎯 创建不透明度子菜单
  const createOpacitySubmenu = useCallback(async () => {
    return await Submenu.new({
      text: "不透明度",
      items: await getOpacityMenuItems()
    });
  }, [getOpacityMenuItems]);

  // 🎯 创建显示/隐藏选择器菜单项
  const createSelectorsVisibilityMenuItem = useCallback(async () => {
    return await CheckMenuItem.new({
      text: selectorsVisible ? "隐藏选择器" : "显示选择器",
      checked: selectorsVisible,
      action: () => {
        setSelectorsVisible(!selectorsVisible);
      }
    });
  }, [selectorsVisible, setSelectorsVisible]);

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

    // 状态对象（用于依赖监听）
    menuStates: {
      scale,
      opacity,
      penetrable,
      alwaysOnTop,
      mirrorMode,
      selectorsVisible,
      currentModel
    }
  };
}
