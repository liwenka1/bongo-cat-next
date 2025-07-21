import type { Live2DModel as BaseLive2DModel } from "pixi-live2d-display";

declare module "pixi-live2d-display" {
  interface Live2DModel {
    motions: Record<string, any>;
    motion(group: string, index?: number): Promise<void>;
  }
}

// Live2D 实例类型定义
export interface Live2DInstance {
  model: BaseLive2DModel | null;
  app: any;
  load: (path: string, modelName: string, canvas: HTMLCanvasElement) => Promise<any>;
  getParameterRange: (id: string) => { min?: number; max?: number };
  setParameterValue: (id: string, value: number) => void;
  resize: () => void;
  destroy: () => void;
  playMotion: (group: string, index?: number) => Promise<void>;
  playExpression: (index: number) => Promise<void>;
}

// Live2D 全局窗口类型定义
declare global {
  interface Window {
    Live2DCubismCore?: unknown;
    Live2DFramework?: unknown;
    LIVE2DCUBISMFRAMEWORK?: unknown;
  }
}
