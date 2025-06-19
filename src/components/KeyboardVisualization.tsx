import { useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useCatStore } from "@/stores/catStore";
import { useModelStore } from "@/stores/modelStore";
import { join } from "@/utils/path";
import Image from "next/image";

// 完整的键盘映射 - 基于实际存在的图片文件
const keyMapping: Record<string, string> = {
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
  
  // 修饰键
  ShiftLeft: "ShiftLeft",
  ShiftRight: "ShiftRight",
  Shift: "Shift",
  ControlLeft: "ControlLeft",
  ControlRight: "ControlRight",
  Control: "Control",
  AltLeft: "Alt",
  AltRight: "AltGr",
  MetaLeft: "Meta",
  MetaRight: "Meta",
  
  // 箭头键 - 修复命名
  ArrowUp: "UpArrow",
  ArrowDown: "DownArrow",
  ArrowLeft: "LeftArrow",
  ArrowRight: "RightArrow",
  
  // 其他键
  Backquote: "BackQuote",
  Slash: "Slash",
  
  // 功能键
  F1: "Fn",
};

export function KeyboardVisualization() {
  const { pressedKeys } = useCatStore();
  const { currentModel } = useModelStore();

  const keyImages = useMemo(() => {
    if (!currentModel || !pressedKeys.length) return [];

    const isKeyboardModel = currentModel.mode === 'keyboard';

    // 键盘模式的左右分区
    const leftKeyCodes = [
      "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT",
      "KeyA", "KeyS", "KeyD", "KeyF", "KeyG",
      "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB",
      "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
      "Tab", "CapsLock", "ShiftLeft", "ControlLeft", "AltLeft", "MetaLeft",
      "Space", "Escape", "Backquote", "Backspace"
    ];

    const rightKeyCodes = [
      "KeyY", "KeyU", "KeyI", "KeyO", "KeyP",
      "KeyH", "KeyJ", "KeyK", "KeyL",
      "KeyN", "KeyM",
      "Digit6", "Digit7", "Digit8", "Digit9", "Digit0",
      "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
      "ShiftRight", "ControlRight", "AltRight", "MetaRight",
      "Enter", "Delete", "Slash"
    ];

    return pressedKeys.map((key) => {
      const mappedKey = keyMapping[key];
      if (!mappedKey) return null;

      let imagePath: string;

      if (isKeyboardModel) {
        // keyboard 模型：根据按键类型决定路径
        const isRightKey = rightKeyCodes.includes(key);
        const keyDir = isRightKey ? "right-keys" : "left-keys";
        imagePath = convertFileSrc(
          join(currentModel.path, "resources", keyDir, `${mappedKey}.png`)
        );
      } else {
        // standard 模型：所有按键都在 left-keys 目录
        imagePath = convertFileSrc(
          join(currentModel.path, "resources", "left-keys", `${mappedKey}.png`)
        );
      }

      return (
        <Image
          width={100}
          height={100}
          key={`${key}-${currentModel.mode}`}
          src={imagePath}
          alt={`${key} key`}
          className="absolute size-full"
          onError={(e) => {
            console.warn(`Failed to load key image: ${imagePath}`);
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }).filter(Boolean);
  }, [pressedKeys, currentModel]);

  return <>{keyImages}</>;
}
