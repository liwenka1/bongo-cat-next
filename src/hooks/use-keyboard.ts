"use client";

import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { readDir, exists } from "@tauri-apps/plugin-fs";
import { join } from "@/utils/path";
import type { SpecificDeviceEvent } from "@/types";
import { toast } from "sonner";

export function useKeyboard() {
  const { setPressedLeftKeys, setPressedRightKeys, setSupportedLeftKeys, setSupportedRightKeys, singleMode } =
    useCatStore();
  const { currentModel } = useModelStore();
  const pressedKeysRef = useRef(new Set<string>());
  const supportedLeftKeysRef = useRef<string[]>([]);
  const supportedRightKeysRef = useRef<string[]>([]);
  const unlistenRef = useRef<(() => void) | null>(null);

  // 更新支持的按键列表
  useEffect(() => {
    if (!currentModel) {
      return;
    }

    const updateSupportedKeys = async () => {
      // 🎯 只为交互式模型读取键盘目录
      const isInteractiveModel = currentModel.id === "keyboard" || currentModel.id === "standard";

      if (!isInteractiveModel) {
        supportedLeftKeysRef.current = [];
        supportedRightKeysRef.current = [];
        setSupportedLeftKeys([]);
        setSupportedRightKeys([]);
        return;
      }

      try {
        // 统一的文件扫描函数
        const scanKeyDirectory = async (side: "left" | "right") => {
          const path = join(currentModel.path, "resources", `${side}-keys`);
          if (await exists(path)) {
            const files = await readDir(path);
            return files.filter((file) => file.name.endsWith(".png")).map((file) => file.name.replace(".png", ""));
          }
          return [];
        };

        // 并行扫描左右键目录
        const [leftKeys, rightKeys] = await Promise.all([scanKeyDirectory("left"), scanKeyDirectory("right")]);

        // 处理修饰键的通用版本
        const addGenericModifiers = (keys: string[], side: "left" | "right") => {
          const modifierKeys = ["Shift", "Control", "Alt", "Meta"];
          const suffix = side === "left" ? "Left" : "Right";

          modifierKeys.forEach((modifier) => {
            const specificKey = `${modifier}${suffix}`;
            if (keys.includes(specificKey) && !keys.includes(modifier)) {
              keys.push(modifier);
            }
          });
        };

        // 添加通用修饰键
        addGenericModifiers(leftKeys, "left");
        addGenericModifiers(rightKeys, "right");

        // 更新状态
        supportedLeftKeysRef.current = leftKeys;
        supportedRightKeysRef.current = rightKeys;
        setSupportedLeftKeys(leftKeys);
        setSupportedRightKeys(rightKeys);
      } catch (error) {
        toast.error(`Failed to update supported keys: ${String(error)}`);

        supportedLeftKeysRef.current = [];
        setSupportedLeftKeys([]);
        supportedRightKeysRef.current = [];
        setSupportedRightKeys([]);
      }
    };

    void updateSupportedKeys();
  }, [currentModel, setSupportedLeftKeys, setSupportedRightKeys]);

  // 获取支持的按键名称
  const getSupportedKey = (key: string): string | null => {
    for (const side of ["left", "right"] as const) {
      let nextKey = key;
      const supportKeys = side === "left" ? supportedLeftKeysRef.current : supportedRightKeysRef.current;

      // 检查是否直接支持
      if (supportKeys.includes(key)) {
        return key;
      }

      // 处理功能键
      if (key.startsWith("F")) {
        nextKey = "Fn";
      }

      // 处理方向键
      const arrowKeyMap: Record<string, string> = {
        ArrowUp: "UpArrow",
        ArrowDown: "DownArrow",
        ArrowLeft: "LeftArrow",
        ArrowRight: "RightArrow"
      };
      if (arrowKeyMap[key]) {
        nextKey = arrowKeyMap[key];
      }

      // 处理修饰键
      for (const modifier of ["Meta", "Shift", "Alt", "Control"]) {
        if (key.startsWith(modifier)) {
          nextKey = key.replace(new RegExp(`^(${modifier}).*`), "$1");
          break;
        }
      }

      // 检查映射后的键名是否支持
      if (supportKeys.includes(nextKey)) {
        return nextKey;
      }
    }

    return null;
  };

  // 更新按键状态
  const updatePressedKeys = () => {
    const leftKeys: string[] = [];
    const rightKeys: string[] = [];

    pressedKeysRef.current.forEach((key) => {
      const mappedKey = getSupportedKey(key);
      if (!mappedKey) return;

      // 根据映射后的键名判断左右手
      const isLeftSide = supportedLeftKeysRef.current.includes(mappedKey);
      const pressedKeys = isLeftSide ? leftKeys : rightKeys;
      pressedKeys.push(mappedKey);
    });

    setPressedLeftKeys(leftKeys);
    setPressedRightKeys(rightKeys);
  };

  // 处理按键按下
  const handleKeyPress = (keyName: string) => {
    if (singleMode) {
      pressedKeysRef.current.clear();
    }
    pressedKeysRef.current.add(keyName);
    updatePressedKeys();
  };

  // 处理按键松开
  const handleKeyRelease = (keyName: string) => {
    pressedKeysRef.current.delete(keyName);
    updatePressedKeys();
  };

  // 浏览器键盘事件监听（应用内）
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleKeyPress(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      handleKeyRelease(event.code);
    };

    // 监听浏览器键盘事件
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [singleMode]);

  // Tauri 全局设备事件监听（应用外）
  useEffect(() => {
    const setupTauriListener = async () => {
      const unlisten = await listen<SpecificDeviceEvent>("device-changed", ({ payload }) => {
        const { kind, value } = payload;

        if (kind === "KeyboardPress" || kind === "KeyboardRelease") {
          if (typeof value === "string") {
            if (kind === "KeyboardPress") {
              handleKeyPress(value);
            } else {
              handleKeyRelease(value);
            }
          }
        }
      });

      unlistenRef.current = unlisten;
    };

    void setupTauriListener();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);
}
