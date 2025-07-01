import { create } from "zustand";

interface GeneralState {
  // State
  autostart: boolean;
  checkUpdate: boolean;
  language: string;
  theme: "light" | "dark" | "auto";

  // Actions
  setAutostart: (autostart: boolean) => void;
  setCheckUpdate: (checkUpdate: boolean) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
}

export const useGeneralStore = create<GeneralState>((set) => ({
  autostart: false,
  checkUpdate: true,
  language: "zh-CN",
  theme: "auto",

  setAutostart: (autostart) => {
    set({ autostart });
  },
  setCheckUpdate: (checkUpdate) => {
    set({ checkUpdate });
  },
  setLanguage: (language) => {
    set({ language });
  },
  setTheme: (theme) => {
    set({ theme });
  }
}));
