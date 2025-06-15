import { create } from "zustand";

interface WindowState {
  focused?: boolean;
  maximized?: boolean;
  minimized?: boolean;
  fullscreen?: boolean;
  resizable?: boolean;
  decorations?: boolean;
  alwaysOnTop?: boolean;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

interface AppState {
  name: string;
  version: string;
  windowState: WindowState;

  // Actions
  setName: (name: string) => void;
  setVersion: (version: string) => void;
  setWindowState: (state: Partial<WindowState>) => void;
  updateWindowState: (updates: Partial<WindowState>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  name: "BongoCat",
  version: "1.0.0",
  windowState: {},

  setName: (name) => { set({ name }); },
  setVersion: (version) => { set({ version }); },
  setWindowState: (windowState) => { set({ windowState }); },
  updateWindowState: (updates) =>
    { set((state) => ({
      windowState: { ...state.windowState, ...updates },
    })); },
}));
