"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * 语言切换便利 Hook
 * 基于标准 useTranslation，提供简化的语言操作
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
    },
    [i18n]
  );

  const isLanguage = useCallback(
    (lng: string) => {
      return i18n.language === lng;
    },
    [i18n.language]
  );

  // 预定义的语言切换函数，使用useCallback确保稳定
  const toZhCN = useCallback(() => changeLanguage("zh-CN"), [changeLanguage]);
  const toEnUS = useCallback(() => changeLanguage("en-US"), [changeLanguage]);
  const isZhCN = useCallback(() => isLanguage("zh-CN"), [isLanguage]);
  const isEnUS = useCallback(() => isLanguage("en-US"), [isLanguage]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isLanguage,
    // 常用语言快捷方法
    toZhCN,
    toEnUS,
    isZhCN,
    isEnUS
  };
}

/**
 * 翻译便利 Hook
 * 预设命名空间的快捷方法
 */
export function useI18n(namespaces?: string | string[]) {
  const { t } = useTranslation(namespaces);
  const language = useLanguage();

  return {
    t,
    ...language
  };
}
