"use client";

import { useTranslation } from "react-i18next";

/**
 * 语言切换便利 Hook
 * 基于标准 useTranslation，提供简化的语言操作
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
  };

  const isLanguage = (lng: string) => {
    return i18n.language === lng;
  };

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isLanguage,
    // 常用语言快捷方法
    toZhCN: () => changeLanguage("zh-CN"),
    toEnUS: () => changeLanguage("en-US"),
    isZhCN: () => isLanguage("zh-CN"),
    isEnUS: () => isLanguage("en-US")
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
