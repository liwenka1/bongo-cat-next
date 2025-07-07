import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

export function useWindow() {
  const showWindow = async () => {
    const window = getCurrentWebviewWindow();
    await window.show();
    await window.setFocus();
  };

  const hideWindow = async () => {
    const window = getCurrentWebviewWindow();
    await window.hide();
  };

  return { showWindow, hideWindow };
}
