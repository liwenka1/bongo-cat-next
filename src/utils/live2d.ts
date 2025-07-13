import type { Cubism4InternalModel, CubismSpec } from "pixi-live2d-display";
import { convertFileSrc } from "@tauri-apps/api/core";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { Cubism4ModelSettings, Live2DModel } from "pixi-live2d-display";
import { Application, Ticker } from "pixi.js";
import { join } from "./path";

// 导入全局类型定义
import "@/types/live2d";

// 直接注册 Ticker，简化初始化
Live2DModel.registerTicker(Ticker);

class Live2d {
  private app: Application | null = null;
  public model: Live2DModel | null = null;
  private userScale: number = 1; // 保留用户缩放功能

  constructor() {}

  private mount(view: HTMLCanvasElement) {
    this.app = new Application({
      view,
      resizeTo: window,
      backgroundAlpha: 0,
      autoDensity: true,
      resolution: devicePixelRatio
    });
  }

  public async load(path: string, modelName: string, canvas: HTMLCanvasElement) {
    // 确保有可用的应用实例
    if (!this.app) {
      this.mount(canvas);
    }

    // 只销毁模型，保留应用实例
    if (this.model) {
      this.model.destroy();
      this.model = null;
    }

    // 清空舞台
    if (this.app) {
      this.app.stage.removeChildren();
    }

    // 使用传入的模型文件名
    const modelPath = join(path, modelName);
    const modelJSON = JSON.parse(await readTextFile(modelPath)) as CubismSpec.ModelJSON;

    const modelSettings = new Cubism4ModelSettings({
      ...modelJSON,
      url: convertFileSrc(modelPath)
    });

    modelSettings.replaceFiles((file: string) => {
      return convertFileSrc(join(path, file));
    });

    this.model = await Live2DModel.from(modelSettings);

    // 保留原有的定位和缩放逻辑
    const model = this.model;
    const app = this.app!;

    // 居中定位
    model.x = app.screen.width / 2;
    model.y = app.screen.height / 2;
    model.anchor.set(0.5, 0.5);

    // 应用用户缩放
    this.applyUserScale();

    app.stage.addChild(model);

    const { motions, expressions } = modelSettings;

    return {
      motions,
      expressions
    };
  }

  private applyUserScale() {
    if (this.model && this.app) {
      const baseScale = this.app.screen.width / this.model.width;
      const finalScale = baseScale * this.userScale;
      this.model.scale.set(finalScale);
    }
  }

  public setUserScale(scale: number) {
    this.userScale = scale;
    this.applyUserScale();
  }

  public resize() {
    if (!this.app || !this.model) return;

    // 重新计算模型位置
    this.model.x = this.app.screen.width / 2;
    this.model.y = this.app.screen.height / 2;

    // 重新应用缩放
    this.applyUserScale();

    // 确保应用程序调整大小
    this.app.resize();
  }

  public destroy(destroyApp: boolean = true) {
    if (this.model) {
      this.model.destroy();
      this.model = null;
    }
    if (destroyApp && this.app) {
      this.app.destroy(true);
      this.app = null;
    }
  }

  public playMotion(group: string, index?: number) {
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
