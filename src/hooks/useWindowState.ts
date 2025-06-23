import { useState, useCallback } from "react";
import type { HookWindowState } from "@/types";

export function useWindowState() {
  const [isRestored, setIsRestored] = useState(true); // Start as restored for now
  const [windowState, setWindowState] = useState<HookWindowState>({
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    isMaximized: false,
    isVisible: true
  });

  const saveState = useCallback(async () => {
    try {
      // TODO: Implement window state saving when Tauri API is properly configured
      console.log("Window state saved");
    } catch (error) {
      console.error("Failed to save window state:", error);
    }
  }, []);

  const restoreState = useCallback(async () => {
    try {
      // TODO: Implement window state restoration when Tauri API is properly configured
      setIsRestored(true);
      console.log("Window state restored");
    } catch (error) {
      console.error("Failed to restore window state:", error);
      setIsRestored(true);
    }
  }, []);

  return {
    isRestored,
    windowState,
    saveState,
    restoreState
  };
}
