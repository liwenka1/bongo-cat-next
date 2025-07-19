"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// 静态导入中文资源
import zhCNMenu from "@/locales/zh-CN/menu.json";
import zhCNWindow from "@/locales/zh-CN/window.json";
import zhCNModels from "@/locales/zh-CN/models.json";
import zhCNSystem from "@/locales/zh-CN/system.json";
import zhCNMotions from "@/locales/zh-CN/motions.json";
import zhCNExpressions from "@/locales/zh-CN/expressions.json";
import zhCNUI from "@/locales/zh-CN/ui.json";

// 静态导入英文资源
import enUSMenu from "@/locales/en-US/menu.json";
import enUSWindow from "@/locales/en-US/window.json";
import enUSModels from "@/locales/en-US/models.json";
import enUSSystem from "@/locales/en-US/system.json";
import enUSMotions from "@/locales/en-US/motions.json";
import enUSExpressions from "@/locales/en-US/expressions.json";
import enUSUI from "@/locales/en-US/ui.json";

const resources = {
  "zh-CN": {
    menu: zhCNMenu,
    window: zhCNWindow,
    models: zhCNModels,
    system: zhCNSystem,
    motions: zhCNMotions,
    expressions: zhCNExpressions,
    ui: zhCNUI
  },
  "en-US": {
    menu: enUSMenu,
    window: enUSWindow,
    models: enUSModels,
    system: enUSSystem,
    motions: enUSMotions,
    expressions: enUSExpressions,
    ui: enUSUI
  }
};

// 标准 react-i18next 配置
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "zh-CN", // 默认中文
    fallbackLng: "zh-CN",
    debug: false,
    interpolation: {
      escapeValue: false // React 已经进行了 XSS 防护
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "bongo-cat-language"
    }
  });

export default i18n;
