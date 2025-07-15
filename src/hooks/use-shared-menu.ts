import { useCallback } from "react";
import { Menu, CheckMenuItem, MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { exit } from "@tauri-apps/plugin-process";

export function useSharedMenu() {
  const {
    visible,
    setVisible,
    scale,
    setScale,
    opacity,
    setOpacity,
    penetrable,
    setPenetrable,
    alwaysOnTop,
    setAlwaysOnTop,
    mirrorMode,
    setMirrorMode
  } = useCatStore();
  const { models, currentModel, setCurrentModel } = useModelStore();

  const getScaleMenuItems = useCallback(async () => {
    // 缩放选项（50-150，每25一个档位）
    const scaleOptions = [50, 75, 100, 125, 150];
    const currentScale = scale;

    const items = await Promise.all(
      scaleOptions.map(async (scaleValue) => {
        return await CheckMenuItem.new({
          text: scaleValue === 100 ? "默认" : `${scaleValue}%`,
          checked: currentScale === scaleValue,
          action: () => {
            console.log(`🎚️ Setting scale to ${scaleValue}%`);
            // 直接设置百分比值
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

  const getOpacityMenuItems = useCallback(async () => {
    // 透明度选项
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

  const getModeMenuItems = useCallback(async () => {
    return await Promise.all(
      Object.values(models).map(async (model) => {
        return await CheckMenuItem.new({
          text: model.name,
          checked: currentModel?.id === model.id,
          action: () => {
            console.log(`🎭 Switching to model: ${model.name}`);
            setCurrentModel(model.id);
          }
        });
      })
    );
  }, [models, currentModel, setCurrentModel]);

  // 完整菜单结构
  const getSharedMenu = useCallback(async () => {
    return await Promise.all([
      // 显示/隐藏猫咪
      await MenuItem.new({
        text: visible ? "隐藏猫咪" : "显示猫咪",
        action: () => {
          setVisible(!visible);
        }
      }),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 模型模式子菜单
      await Submenu.new({
        text: "模型模式",
        items: await getModeMenuItems()
      }),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 窗口穿透
      await CheckMenuItem.new({
        text: "窗口穿透",
        checked: penetrable,
        action: () => {
          setPenetrable(!penetrable);
        }
      }),

      // 始终置顶
      await CheckMenuItem.new({
        text: "始终置顶",
        checked: alwaysOnTop,
        action: () => {
          setAlwaysOnTop(!alwaysOnTop);
        }
      }),

      // 镜像模式
      await CheckMenuItem.new({
        text: "镜像模式",
        checked: mirrorMode,
        action: () => {
          setMirrorMode(!mirrorMode);
        }
      }),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 窗口尺寸子菜单
      await Submenu.new({
        text: "窗口尺寸",
        items: await getScaleMenuItems()
      }),

      // 不透明度子菜单
      await Submenu.new({
        text: "不透明度",
        items: await getOpacityMenuItems()
      }),

      // 分隔符
      await PredefinedMenuItem.new({ item: "Separator" }),

      // 退出
      await MenuItem.new({
        text: "退出",
        action: () => void exit(0)
      })
    ]);
  }, [
    visible,
    setVisible,
    getModeMenuItems,
    penetrable,
    setPenetrable,
    alwaysOnTop,
    setAlwaysOnTop,
    mirrorMode,
    setMirrorMode,
    getScaleMenuItems,
    getOpacityMenuItems
  ]);

  // 显示上下文菜单的方法
  const showContextMenu = useCallback(async () => {
    try {
      const menu = await Menu.new({
        items: await getSharedMenu()
      });

      await menu.popup();
    } catch (error) {
      console.error("Failed to show context menu:", error);
    }
  }, [getSharedMenu]);

  return {
    getSharedMenu,
    showContextMenu,
    getModeMenuItems,
    getScaleMenuItems,
    getOpacityMenuItems
  };
}
