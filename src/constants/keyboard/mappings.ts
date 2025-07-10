/**
 * 键盘映射常量定义
 * 包含浏览器键码和rdev键码到文件名的映射关系
 */

import type { KeyMapping } from "./types";

/**
 * 浏览器键码到文件名的映射
 * 基于标准的 KeyboardEvent.code 值
 */
export const BROWSER_KEY_MAPPING: KeyMapping = {
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
} as const;

/**
 * rdev 键名到文件名的映射
 * 基于 rdev 库的 Debug 输出格式
 */
export const RDEV_KEY_MAPPING: KeyMapping = {
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
} as const;

/**
 * 左手键位列表 - 用于判断按键属于左手还是右手
 */
export const LEFT_HAND_KEYS = [
  // 字母键 (左半部分)
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",

  // 数字键 (左半部分)
  "Num1",
  "Num2",
  "Num3",
  "Num4",
  "Num5",

  // 修饰键
  "ShiftLeft",
  "ControlLeft",
  "Alt",
  "Meta",

  // 功能键
  "Tab",
  "CapsLock",
  "Escape",
  "BackQuote",

  // 其他
  "Fn"
] as const;

/**
 * 右手键位列表
 */
export const RIGHT_HAND_KEYS = [
  // 字母键 (右半部分)
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyN",
  "KeyM",

  // 数字键 (右半部分)
  "Num6",
  "Num7",
  "Num8",
  "Num9",
  "Num0",

  // 修饰键
  "ShiftRight",
  "ControlRight",
  "AltGr",

  // 箭头键
  "UpArrow",
  "DownArrow",
  "LeftArrow",
  "RightArrow",

  // 其他
  "Return",
  "Backspace",
  "Delete",
  "Slash",
  "Space"
] as const;
