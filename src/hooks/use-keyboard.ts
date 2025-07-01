"use client";

import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useCatStore } from "@/stores/cat-store";
import { useModelStore } from "@/stores/model-store";
import { readDir, exists } from "@tauri-apps/plugin-fs";
import { join } from "@/utils/path";
import type { SpecificDeviceEvent } from "@/types";

// 浏览器键码到文件名的映射
const browserKeyMapping: Record<string, string> = {
  // 字母键
  KeyA: "KeyA",
  KeyB: "KeyB",
  KeyC: "KeyC",
  KeyD: "KeyD",
  KeyE: "KeyE",
  KeyF: "KeyF",
  KeyG: "KeyG",
  KeyH: "KeyH",
  KeyI: "KeyI",
  KeyJ: "KeyJ",
  KeyK: "KeyK",
  KeyL: "KeyL",
  KeyM: "KeyM",
  KeyN: "KeyN",
  KeyO: "KeyO",
  KeyP: "KeyP",
  KeyQ: "KeyQ",
  KeyR: "KeyR",
  KeyS: "KeyS",
  KeyT: "KeyT",
  KeyU: "KeyU",
  KeyV: "KeyV",
  KeyW: "KeyW",
  KeyX: "KeyX",
  KeyY: "KeyY",
  KeyZ: "KeyZ",

  // 数字键
  Digit0: "Num0",
  Digit1: "Num1",
  Digit2: "Num2",
  Digit3: "Num3",
  Digit4: "Num4",
  Digit5: "Num5",
  Digit6: "Num6",
  Digit7: "Num7",
  Digit8: "Num8",
  Digit9: "Num9",

  // 功能键
  Space: "Space",
  Tab: "Tab",
  Enter: "Return",
  Backspace: "Backspace",
  Delete: "Delete",
  Escape: "Escape",
  CapsLock: "CapsLock",

  // 修饰键 - 明确区分左右
  ShiftLeft: "ShiftLeft",
  ShiftRight: "ShiftRight",
  ControlLeft: "ControlLeft",
  ControlRight: "ControlRight",
  AltLeft: "Alt",
  AltRight: "AltGr",
  MetaLeft: "Meta",
  MetaRight: "Meta",

  // 箭头键
  ArrowUp: "UpArrow",
  ArrowDown: "DownArrow",
  ArrowLeft: "LeftArrow",
  ArrowRight: "RightArrow",

  // 其他键
  Backquote: "BackQuote",
  Slash: "Slash",

  // 功能键
  F1: "Fn",
  F2: "Fn",
  F3: "Fn",
  F4: "Fn",
  F5: "Fn",
  F6: "Fn",
  F7: "Fn",
  F8: "Fn",
  F9: "Fn",
  F10: "Fn",
  F11: "Fn",
  F12: "Fn"
};

// rdev 键名到文件名的映射（根据 rdev 的 Debug 输出格式）
const rdevKeyMapping: Record<string, string> = {
  // 字母键
  KeyA: "KeyA",
  KeyB: "KeyB",
  KeyC: "KeyC",
  KeyD: "KeyD",
  KeyE: "KeyE",
  KeyF: "KeyF",
  KeyG: "KeyG",
  KeyH: "KeyH",
  KeyI: "KeyI",
  KeyJ: "KeyJ",
  KeyK: "KeyK",
  KeyL: "KeyL",
  KeyM: "KeyM",
  KeyN: "KeyN",
  KeyO: "KeyO",
  KeyP: "KeyP",
  KeyQ: "KeyQ",
  KeyR: "KeyR",
  KeyS: "KeyS",
  KeyT: "KeyT",
  KeyU: "KeyU",
  KeyV: "KeyV",
  KeyW: "KeyW",
  KeyX: "KeyX",
  KeyY: "KeyY",
  KeyZ: "KeyZ",

  // 数字键
  Num0: "Num0",
  Num1: "Num1",
  Num2: "Num2",
  Num3: "Num3",
  Num4: "Num4",
  Num5: "Num5",
  Num6: "Num6",
  Num7: "Num7",
  Num8: "Num8",
  Num9: "Num9",

  // 功能键
  Space: "Space",
  Tab: "Tab",
  Return: "Return",
  Backspace: "Backspace",
  Delete: "Delete",
  Escape: "Escape",
  CapsLock: "CapsLock",

  // 修饰键 - 明确区分左右
  ShiftLeft: "ShiftLeft",
  ShiftRight: "ShiftRight",
  ControlLeft: "ControlLeft",
  ControlRight: "ControlRight",
  Alt: "Alt",
  AltGr: "AltGr",
  MetaLeft: "Meta",
  MetaRight: "Meta",

  // 箭头键
  UpArrow: "UpArrow",
  DownArrow: "DownArrow",
  LeftArrow: "LeftArrow",
  RightArrow: "RightArrow",

  // 其他键
  BackQuote: "BackQuote",
  Slash: "Slash",

  // 功能键
  F1: "Fn",
  F2: "Fn",
  F3: "Fn",
  F4: "Fn",
  F5: "Fn",
  F6: "Fn",
  F7: "Fn",
  F8: "Fn",
  F9: "Fn",
  F10: "Fn",
  F11: "Fn",
  F12: "Fn"
};

export function useKeyboard() {
  const { setPressedLeftKeys, setPressedRightKeys, setSupportedLeftKeys, setSupportedRightKeys, singleMode } =
    useCatStore();
  const { currentModel } = useModelStore();
  const pressedKeysRef = useRef(new Set<string>());
  const supportedLeftKeysRef = useRef<string[]>([]);
  const supportedRightKeysRef = useRef<string[]>([]);
  const unlistenRef = useRef<(() => void) | null>(null);

  // 添加调试日志来监控 currentModel 的变化
  useEffect(() => {
    console.log("🎭 useKeyboard currentModel changed:", currentModel);
  }, [currentModel]);

  // 更新支持的按键列表
  useEffect(() => {
    console.log("🔄 updateSupportedKeys useEffect triggered, currentModel:", currentModel);
    if (!currentModel) {
      console.log("❌ No current model, skipping key directory scan");
      return;
    }

    const updateSupportedKeys = async () => {
      console.log("📁 Starting to read key directories for model:", currentModel.path);
      try {
        // 检查左键目录
        try {
          const leftPath = join(currentModel.path, "resources", "left-keys");
          console.log("📂 Reading left keys from:", leftPath);
          const leftFiles = await readDir(leftPath);
          console.log(
            "📄 Left files found:",
            leftFiles.map((f) => f.name)
          );
          const leftKeys = leftFiles
            .filter((file) => file.name.endsWith(".png"))
            .map((file) => file.name.replace(".png", ""));
          console.log("👈 Processed left keys:", leftKeys);
          supportedLeftKeysRef.current = leftKeys;
          setSupportedLeftKeys(leftKeys);
        } catch (error) {
          console.warn("❌ Failed to read left keys directory:", error);
          supportedLeftKeysRef.current = [];
          setSupportedLeftKeys([]);
        }

        // 检查右键目录
        try {
          const rightPath = join(currentModel.path, "resources", "right-keys");
          console.log("📂 Reading right keys from:", rightPath);
          const rightFiles = await readDir(rightPath);
          console.log(
            "📄 Right files found:",
            rightFiles.map((f) => f.name)
          );
          const rightKeys = rightFiles
            .filter((file) => file.name.endsWith(".png"))
            .map((file) => file.name.replace(".png", ""));
          console.log("👉 Processed right keys:", rightKeys);
          supportedRightKeysRef.current = rightKeys;
          setSupportedRightKeys(rightKeys);
        } catch (error) {
          console.warn("❌ Failed to read right keys directory:", error);
          supportedRightKeysRef.current = [];
          setSupportedRightKeys([]);
        }

        // 特殊处理左右修饰键
        const modifierKeys = ["Shift", "Control", "Alt", "Meta"];
        for (const modifier of modifierKeys) {
          // 检查是否有 Left/Right 变体
          const leftVariant = `${modifier}Left`;
          const rightVariant = `${modifier}Right`;

          // 检查左变体是否在左键目录中存在
          if (supportedLeftKeysRef.current.includes(leftVariant) && !supportedLeftKeysRef.current.includes(modifier)) {
            console.log(`⚙️ Adding generic ${modifier} to left keys based on ${leftVariant}`);
            supportedLeftKeysRef.current.push(modifier);
          }

          // 检查右变体是否在右键目录中存在
          if (supportedRightKeysRef.current.includes(rightVariant) && !supportedRightKeysRef.current.includes(modifier)) {
            console.log(`⚙️ Adding generic ${modifier} to right keys based on ${rightVariant}`);
            supportedRightKeysRef.current.push(modifier);
          }
        }

        // 更新 store 中的支持按键列表
        setSupportedLeftKeys([...supportedLeftKeysRef.current]);
        setSupportedRightKeys([...supportedRightKeysRef.current]);

      } catch (error) {
        console.error("Failed to read key directories:", error);
      }
    };

    void updateSupportedKeys();
  }, [currentModel, setSupportedLeftKeys, setSupportedRightKeys]);

  // 获取支持的按键名称
  const getSupportedKey = (key: string, isFromTauri = false): string | null => {
    const keyMapping = isFromTauri ? rdevKeyMapping : browserKeyMapping;
    let mappedKey = keyMapping[key] || key;

    // 处理功能键映射
    if (
      key.startsWith("F") &&
      !supportedLeftKeysRef.current.includes(mappedKey) &&
      !supportedRightKeysRef.current.includes(mappedKey)
    ) {
      mappedKey = "Fn";
    }

    // 处理修饰键的精确映射
    if (key.includes("Left") || key.includes("Right")) {
      // 优先使用精确的左右修饰键
      if (supportedLeftKeysRef.current.includes(mappedKey) || supportedRightKeysRef.current.includes(mappedKey)) {
        return mappedKey;
      }
      
      // 如果没有精确的左右修饰键，尝试使用通用版本
      const genericKey = key.replace("Left", "").replace("Right", "");
      const genericMapped = keyMapping[genericKey] || genericKey;
      
      if (supportedLeftKeysRef.current.includes(genericMapped) || supportedRightKeysRef.current.includes(genericMapped)) {
        return genericMapped;
      }
    }
    
    // 尝试使用通用版本的修饰键
    if (["Shift", "Control", "Alt", "Meta"].some(modifier => key.includes(modifier))) {
      const genericKey = key.replace("Left", "").replace("Right", "");
      const genericMapped = keyMapping[genericKey] || genericKey;
      
      if (supportedLeftKeysRef.current.includes(genericMapped) || supportedRightKeysRef.current.includes(genericMapped)) {
        return genericMapped;
      }
    }

    // 检查按键是否被支持
    if (supportedLeftKeysRef.current.includes(mappedKey) || supportedRightKeysRef.current.includes(mappedKey)) {
      return mappedKey;
    }

    return null;
  };

  // 更新按键状态
  const updatePressedKeys = () => {
    console.log("🔄 updatePressedKeys called");
    console.log("📂 supportedLeftKeys:", supportedLeftKeysRef.current);
    console.log("📂 supportedRightKeys:", supportedRightKeysRef.current);

    const leftKeys: string[] = [];
    const rightKeys: string[] = [];

    pressedKeysRef.current.forEach((key) => {
      // 尝试两种映射方式
      const browserMapped = getSupportedKey(key, false);
      const tauriMapped = getSupportedKey(key, true);
      const mappedKey = browserMapped ?? tauriMapped;

      console.log(`🔍 Key mapping: ${key} -> browser: ${browserMapped}, tauri: ${tauriMapped}, final: ${mappedKey}`);

      if (!mappedKey) {
        console.log(`❌ No mapping found for key: ${key}`);
        return;
      }

      // 检查是否是左右修饰键
      const isLeftModifier = key.includes("Left");
      const isRightModifier = key.includes("Right");

      // 优先根据键名判断左右
      if (isLeftModifier && supportedLeftKeysRef.current.includes(mappedKey)) {
        leftKeys.push(mappedKey);
        console.log(`👈 Added ${mappedKey} to left keys (by name)`);
      } else if (isRightModifier && supportedRightKeysRef.current.includes(mappedKey)) {
        rightKeys.push(mappedKey);
        console.log(`👉 Added ${mappedKey} to right keys (by name)`);
      }
      // 然后根据支持的键位列表判断
      else if (supportedLeftKeysRef.current.includes(mappedKey)) {
        leftKeys.push(mappedKey);
        console.log(`👈 Added ${mappedKey} to left keys`);
      } else if (supportedRightKeysRef.current.includes(mappedKey)) {
        rightKeys.push(mappedKey);
        console.log(`👉 Added ${mappedKey} to right keys`);
      } else {
        console.log(`⚠️ Mapped key ${mappedKey} not found in supported lists`);
      }
    });

    console.log("🔄 Final result - Left:", leftKeys, "Right:", rightKeys);
    setPressedLeftKeys(leftKeys);
    setPressedRightKeys(rightKeys);
  };

  // 处理按键按下
  const handleKeyPress = (keyName: string) => {
    console.log("🔵 handleKeyPress:", keyName);
    if (singleMode) {
      pressedKeysRef.current.clear();
    }
    pressedKeysRef.current.add(keyName);
    console.log("📝 pressedKeysRef after add:", Array.from(pressedKeysRef.current));
    updatePressedKeys();
  };

  // 处理按键松开
  const handleKeyRelease = (keyName: string) => {
    console.log("🔴 handleKeyRelease:", keyName);
    pressedKeysRef.current.delete(keyName);
    console.log("📝 pressedKeysRef after delete:", Array.from(pressedKeysRef.current));
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
      try {
        const unlisten = await listen<SpecificDeviceEvent>("device-changed", ({ payload }) => {
          const { kind, value } = payload;

          if (kind === "KeyboardPress" || kind === "KeyboardRelease") {
            if (typeof value === "string") {
              // 添加调试日志以了解实际的键名格式
              console.log("Tauri key event:", kind, value);

              if (kind === "KeyboardPress") {
                handleKeyPress(value);
              } else {
                handleKeyRelease(value);
              }
            }
          }
        });

        unlistenRef.current = unlisten;
      } catch (error) {
        console.error("Failed to setup Tauri device listener:", error);
      }
    };

    void setupTauriListener();

    return () => {
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // 窗口失焦时清空按键状态
  useEffect(() => {
    const handleBlur = () => {
      pressedKeysRef.current.clear();
      setPressedLeftKeys([]);
      setPressedRightKeys([]);
    };

    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [setPressedLeftKeys, setPressedRightKeys]);

  // 检查键位在左右目录中的可用性
  const checkKeyAvailability = async (key: string): Promise<{ left: boolean; right: boolean }> => {
    if (!currentModel) return { left: false, right: false };
    
    try {
      const leftPath = join(currentModel.path, "resources", "left-keys", `${key}.png`);
      const rightPath = join(currentModel.path, "resources", "right-keys", `${key}.png`);
      
      const [leftExists, rightExists] = await Promise.all([
        exists(leftPath),
        exists(rightPath)
      ]);
      
      return { left: leftExists, right: rightExists };
    } catch (error) {
      console.error(`Error checking key availability for ${key}:`, error);
      return { left: false, right: false };
    }
  };
}
