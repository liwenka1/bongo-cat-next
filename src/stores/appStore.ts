import { create } from "zustand";
import type { AppWindowState } from '@/types';

interface AppState {
  name: string;
  version: string;
  windowState: AppWindowState;

  // Actions
  setName: (name: string) => void;
  setVersion: (version: string) => void;
  setWindowState: (state: Partial<AppWindowState>) => void;
  updateWindowState: (updates: Partial<AppWindowState>) => void;
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
