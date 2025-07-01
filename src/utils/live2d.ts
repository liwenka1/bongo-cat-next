import type { Cubism4InternalModel } from "pixi-live2d-display";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Cubism4ModelSettings, Live2DModel } from "pixi-live2d-display";
import { Application, Ticker } from "pixi.js";
import { join } from "./path";

// 导入全局类型定义
import "@/types/live2d";

// 检查 Live2D 运行时是否已加载
function checkLive2DRuntime(): boolean {
  if (typeof window === "undefined") return false;

  // 检查 Live2D Cubism Core
  const hasCore = !!window.Live2DCubismCore;
  // 检查 Live2D SDK
  const hasSDK = !!window.Live2DFramework || !!window.LIVE2DCUBISMFRAMEWORK;

  console.log("Live2D Runtime Check:", { hasCore, hasSDK });

  return hasCore || hasSDK; // 至少需要其中一个
}

// 等待 Live2D 运行时加载
function waitForLive2DRuntime(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (checkLive2DRuntime()) {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5秒超时

    const checkInterval = setInterval(() => {
      attempts++;

      if (checkLive2DRuntime()) {
        clearInterval(checkInterval);
        console.log("✅ Live2D runtime loaded after", attempts * 100, "ms");
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error("❌ Live2D runtime failed to load within timeout");
        reject(
          new Error("Live2D runtime not available. Please ensure live2d.min.js and live2dcubismcore.min.js are loaded.")
        );
      }
    }, 100);
  });
}

// 初始化 Live2D Ticker（只在运行时可用时）
async function initializeLive2DTicker() {
  try {
    await waitForLive2DRuntime();
    Live2DModel.registerTicker(Ticker);
    console.log("✅ Live2D Ticker registered");
  } catch (error) {
    console.error("❌ Failed to initialize Live2D Ticker:", error);
    throw error;
  }
}

class Live2d {
  private app: Application | null = null;
  public model: Live2DModel | null = null;
  private userScale: number = 1; // 用户设置的缩放比例
  private initialized: boolean = false;

  constructor() {}

  private async ensureInitialized() {
    if (!this.initialized) {
      await initializeLive2DTicker();
      this.initialized = true;
    }
  }

  private mount() {
    const view = document.getElementById("live2dCanvas");

    if (!(view instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element with id "live2dCanvas" not found');
    }

    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: devicePixelRatio
    });

    console.log("Live2D Application mounted:", this.app.screen.width, "x", this.app.screen.height);
  }

  public async load(path: string) {
    console.log("Loading Live2D model from:", path);

    // 确保 Live2D 运行时已初始化
    await this.ensureInitialized();

    if (!this.app) {
      this.mount();
    }

    // 清理现有的应用
    this.destroy();

    // 🎯 直接使用固定的模型文件名，就像原始项目
    const modelPath = join(path, "cat.model3.json");
    const modelUrl = convertFileSrc(modelPath);

    try {
      // 获取模型JSON配置
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error(`Failed to load model config: ${response.statusText}`);
      }

      const modelJSON = (await response.json()) as Record<string, unknown>;

      // 🚀 完全复制原始项目的模型设置创建方式
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: modelUrl
      } as any);

      // 🚀 完全复制原始项目的文件路径替换逻辑
      modelSettings.replaceFiles((file: string) => {
        return convertFileSrc(join(path, file));
      });

      this.model = await Live2DModel.from(modelSettings);

      // 设置模型的初始位置和缩放
      // 此时 model 和 app 都已经被创建，使用非空断言
      const model = this.model;
      const app = this.app!;

      // 居中定位
      model.x = app.screen.width / 2;
      model.y = app.screen.height / 2;
      model.anchor.set(0.5, 0.5);

      // 🎯 统一缩放逻辑：应用用户设置的缩放
      this.applyUserScale();

      app.stage.addChild(model);

      console.log("Live2D model loaded and positioned:", {
        x: model.x,
        y: model.y,
        scale: model.scale.x,
        modelSize: { width: model.width, height: model.height },
        screenSize: { width: app.screen.width, height: app.screen.height }
      });

      const { motions, expressions } = modelSettings;

      return {
        motions,
        expressions
      };
    } catch (error) {
      console.error("Failed to load Live2D model:", error);
      throw error;
    }
  }

  private applyUserScale() {
    if (this.model && this.app) {
      // 🎯 统一缩放逻辑：使用与 handleResize 相同的简单比例计算
      // 直接按照窗口宽度与模型宽度的比例缩放，再乘以用户设置的缩放
      const baseScale = this.app.screen.width / this.model.width;
      const finalScale = baseScale * this.userScale;
      this.model.scale.set(finalScale);

      console.log("Applied unified user scale:", {
        userScale: this.userScale,
        baseScale: baseScale,
        finalScale: finalScale,
        screenSize: { width: this.app.screen.width, height: this.app.screen.height },
        modelSize: { width: this.model.width, height: this.model.height }
      });
    }
  }

  public setUserScale(scale: number) {
    this.userScale = scale;
    this.applyUserScale();
  }

  public resize() {
    if (this.app && this.model) {
      console.log("Resizing Live2D model:", this.app.screen.width, "x", this.app.screen.height);

      // 重新计算模型位置
      this.model.x = this.app.screen.width / 2;
      this.model.y = this.app.screen.height / 2;

      // 重新应用缩放
      this.applyUserScale();

      // 确保应用程序调整大小
      this.app.resize();

      console.log("Live2D model resized:", {
        x: this.model.x,
        y: this.model.y,
        scale: this.model.scale.x
      });
    }
  }

  public destroy() {
    this.model?.destroy();
  }

  public playMotion(group: string, index: number) {
    return this.model?.motion(group, index);
  }

  public playExpression(index: number) {
    return this.model?.expression(index);
  }

  public getCoreModel() {
    if (!this.model) return null;
    const internalModel = this.model.internalModel as Cubism4InternalModel;
    return internalModel.coreModel;
  }

  public getParameterRange(id: string) {
    const coreModel = this.getCoreModel();
    if (!coreModel) return { min: undefined, max: undefined };

    const index = coreModel.getParameterIndex(id);
    const min = coreModel.getParameterMinimumValue(index);
    const max = coreModel.getParameterMaximumValue(index);

    return {
      min,
      max
    };
  }

  public setParameterValue(id: string, value: number) {
    const coreModel = this.getCoreModel();
    if (!coreModel) return;

    coreModel.setParameterValueById(id, Number(value));
  }
}

const live2d = new Live2d();

export default live2d;
