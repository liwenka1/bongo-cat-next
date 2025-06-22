// 设备事件类型定义（通用版本）
export interface DeviceEvent {
  kind: string;
  value?: unknown;
}

// 设备事件类型定义（具体版本）
export interface SpecificDeviceEvent {
  kind: 'MousePress' | 'MouseRelease' | 'MouseMove' | 'KeyboardPress' | 'KeyboardRelease';
  value: string | { x: number; y: number };
}

// 鼠标移动值类型
export interface MouseMoveValue {
  x: number;
  y: number;
}

// 键盘按键类型
export interface Key {
  eventKey: string;
  tauriKey?: string;
  symbol?: string;
} 