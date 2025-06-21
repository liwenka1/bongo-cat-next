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
  const { pressedLeftKeys, pressedRightKeys } = useCatStore();
  const { currentModel } = useModelStore();

  // 根据按键生成图片路径
  const resolveImagePath = (key: string, side: "left" | "right" = "left") => {
    if (!currentModel) return "";
    return convertFileSrc(
      join(currentModel.path, "resources", `${side}-keys`, `${key}.png`)
    );
  };

  const leftKeyImages = useMemo(() => {
    if (!currentModel || !pressedLeftKeys.length) return [];

    return pressedLeftKeys.map((key) => (
      <Image
        key={`left-${key}`}
        width={100}
        height={100}
        src={resolveImagePath(key, "left")}
        alt={`${key} key`}
        className="absolute size-full z-10"
      />
    ));
  }, [pressedLeftKeys, currentModel]);

  const rightKeyImages = useMemo(() => {
    if (!currentModel || !pressedRightKeys.length) return [];

    return pressedRightKeys.map((key) => (
      <Image
        key={`right-${key}`}
        width={100}
        height={100}
        src={resolveImagePath(key, "right")}
        alt={`${key} key`}
        className="absolute size-full z-10"
      />
    ));
  }, [pressedRightKeys, currentModel]);

  return (
    <>
      {leftKeyImages}
      {rightKeyImages}
    </>
  );
}