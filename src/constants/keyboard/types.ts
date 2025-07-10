/**
 * 键盘映射相关类型定义
 */

// 键码映射类型
export type KeyMapping = Record<string, string>;

// 支持的键盘事件源类型
export type KeyboardSource = "browser" | "rdev";

// 键盘映射配置
export interface KeyboardMappingConfig {
  browser: KeyMapping;
  rdev: KeyMapping;
}

// 常用的键码类型
export type CommonKeys =
  | "Space"
  | "Tab"
  | "Return"
  | "Backspace"
  | "Delete"
  | "Escape"
  | "CapsLock"
  | "ShiftLeft"
  | "ShiftRight"
  | "ControlLeft"
  | "ControlRight"
  | "Alt"
  | "AltGr"
  | "Meta"
  | "UpArrow"
  | "DownArrow"
  | "LeftArrow"
  | "RightArrow"
  | "BackQuote"
  | "Slash"
  | "Fn";

// 字母键类型
export type LetterKeys =
  | "KeyA"
  | "KeyB"
  | "KeyC"
  | "KeyD"
  | "KeyE"
  | "KeyF"
  | "KeyG"
  | "KeyH"
  | "KeyI"
  | "KeyJ"
  | "KeyK"
  | "KeyL"
  | "KeyM"
  | "KeyN"
  | "KeyO"
  | "KeyP"
  | "KeyQ"
  | "KeyR"
  | "KeyS"
  | "KeyT"
  | "KeyU"
  | "KeyV"
  | "KeyW"
  | "KeyX"
  | "KeyY"
  | "KeyZ";

// 数字键类型
export type NumberKeys = "Num0" | "Num1" | "Num2" | "Num3" | "Num4" | "Num5" | "Num6" | "Num7" | "Num8" | "Num9";

// 所有支持的键类型
export type SupportedKeys = CommonKeys | LetterKeys | NumberKeys;
