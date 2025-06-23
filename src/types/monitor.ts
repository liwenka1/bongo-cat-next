// 光标位置类型
export interface CursorPosition {
  x: number;
  y: number;
}

// 监视器类型
export interface Monitor {
  name?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  scaleFactor: number;
  cursorPosition?: CursorPosition;
}
