/**
 * 键盘常量主导出文件
 * 统一导出所有键盘相关的常量、类型和工具函数
 */

// 导出类型
export type {
  KeyMapping,
  KeyboardSource,
  KeyboardMappingConfig,
  CommonKeys,
  LetterKeys,
  NumberKeys,
  SupportedKeys
} from "./types";

// 导出映射常量
export { BROWSER_KEY_MAPPING, RDEV_KEY_MAPPING, LEFT_HAND_KEYS, RIGHT_HAND_KEYS } from "./mappings";

// 导入用于内部使用
import { BROWSER_KEY_MAPPING, RDEV_KEY_MAPPING, LEFT_HAND_KEYS, RIGHT_HAND_KEYS } from "./mappings";
import type { KeyboardMappingConfig } from "./types";

// 导出配置对象（便于使用）
export const KEYBOARD_MAPPINGS: KeyboardMappingConfig = {
  browser: BROWSER_KEY_MAPPING,
  rdev: RDEV_KEY_MAPPING
} as const;

// 工具函数：根据源类型获取对应的映射
export function getKeyMapping(source: "browser" | "rdev") {
  return KEYBOARD_MAPPINGS[source];
}

// 工具函数：判断键是否属于左手
export function isLeftHandKey(key: string): boolean {
  return (LEFT_HAND_KEYS as readonly string[]).includes(key);
}

// 工具函数：判断键是否属于右手
export function isRightHandKey(key: string): boolean {
  return (RIGHT_HAND_KEYS as readonly string[]).includes(key);
}

// 重新导出原始的映射常量，保持向后兼容
export const browserKeyMapping = BROWSER_KEY_MAPPING;
export const rdevKeyMapping = RDEV_KEY_MAPPING;
