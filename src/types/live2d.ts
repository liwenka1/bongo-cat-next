// Live2D 模型类型定义
export interface Live2DModel {
  scale: {
    set: (value: number) => void;
  };
}

// Live2D 应用类型定义
export interface Live2DApp {
  resize: () => void;
}

// Live2D 实例类型定义
export interface Live2DInstance {
  model: Live2DModel | null;
  app: Live2DApp | null;
  load: (path: string) => Promise<void>;
  getParameterRange: (id: string) => { min?: number; max?: number };
  setParameterValue: (id: string, value: number) => void;
  setUserScale: (scale: number) => void;
  resize: () => void;
  playMotion?: (group: string, index: number) => Promise<void>;
  playExpression?: (index: number) => Promise<void>;
}

// 模型JSON类型定义
export interface ModelJSON {
  Version: number;
  FileReferences: {
    Moc?: string;
    Textures?: string[];
    Physics?: string;
    Pose?: string;
    Expressions?: Array<{ Name: string; File: string }>;
    Motions?: Record<string, Array<{ File: string; Sound?: string }>>;
  };
  Groups?: Array<{
    Target: string;
    Name: string;
    Ids: string[];
  }>;
}

// Live2D 全局窗口类型定义
declare global {
  interface Window {
    Live2DCubismCore?: unknown;
    Live2DFramework?: unknown;
    LIVE2DCUBISMFRAMEWORK?: unknown;
  }
}
