// 窗口状态类型（用于 appStore）
export interface AppWindowState {
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
