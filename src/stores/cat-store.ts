import { create } from "zustand";

interface CatState {
  // 显示状态
  visible: boolean;
  opacity: number;
  alwaysOnTop: boolean;
  penetrable: boolean;
  mirrorMode: boolean;
  singleMode: boolean;
  mouseMirror: boolean;
  selectorsVisible: boolean;

  // 位置和大小
  x: number;
  y: number;
  scale: number;

  // 交互状态 - 键盘分组
  pressedLeftKeys: string[];
  pressedRightKeys: string[];
  supportedLeftKeys: string[];
  supportedRightKeys: string[];
  mousePressed: string[];
  mousePosition: { x: number; y: number };

  // 模型相关
  currentModelPath: string;
  backgroundImage: string;
  selectedMotion: { group: string; name: string } | null;
  availableMotions: { group: string; name: string; displayName: string }[]; // 可用动作列表
  selectedExpression: { name: string } | null;
  availableExpressions: { name: string; displayName: string }[]; // 可用表情列表

  // Actions
  setVisible: (visible: boolean) => void;
  setOpacity: (opacity: number) => void;
  setAlwaysOnTop: (alwaysOnTop: boolean) => void;
  setPenetrable: (penetrable: boolean) => void;
  setMirrorMode: (mirrorMode: boolean) => void;
  setSingleMode: (singleMode: boolean) => void;
  setMouseMirror: (mouseMirror: boolean) => void;
  setSelectorsVisible: (visible: boolean) => void;
  setPosition: (x: number, y: number) => void;
  setScale: (scale: number) => void;

  // 键盘管理方法
  setPressedLeftKeys: (keys: string[]) => void;
  setPressedRightKeys: (keys: string[]) => void;
  setSupportedLeftKeys: (keys: string[]) => void;
  setSupportedRightKeys: (keys: string[]) => void;

  setMousePressed: (pressed: string[]) => void;
  setMousePosition: (x: number, y: number) => void;
  setCurrentModelPath: (path: string) => void;
  setBackgroundImage: (image: string) => void;
  setSelectedMotion: (motion: { group: string; name: string } | null) => void;
  setAvailableMotions: (motions: { group: string; name: string; displayName: string }[]) => void; // 设置可用动作
  setSelectedExpression: (expression: { name: string } | null) => void;
  setAvailableExpressions: (expressions: { name: string; displayName: string }[]) => void; // 设置可用表情
}

export const useCatStore = create<CatState>((set, get) => ({
  // 初始状态
  visible: true,
  opacity: 100,
  alwaysOnTop: true,
  penetrable: false,
  mirrorMode: false,
  singleMode: false,
  mouseMirror: false,
  selectorsVisible: true,

  x: 0,
  y: 0,
  scale: 100,

  // 键盘分组状态
  pressedLeftKeys: [],
  pressedRightKeys: [],
  supportedLeftKeys: [],
  supportedRightKeys: [],

  mousePressed: [],
  mousePosition: { x: 0, y: 0 },

  currentModelPath: "standard",
  backgroundImage: "",
  selectedMotion: null,
  availableMotions: [], // 可用动作列表
  selectedExpression: null,
  availableExpressions: [], // 可用表情列表

  // Actions
  setVisible: (visible) => {
    set({ visible });
  },
  setOpacity: (opacity) => {
    set({ opacity });
  },
  setAlwaysOnTop: (alwaysOnTop) => {
    set({ alwaysOnTop });
  },
  setPenetrable: (penetrable) => {
    set({ penetrable });
  },
  setMirrorMode: (mirrorMode) => {
    set({ mirrorMode });
  },
  setSingleMode: (singleMode) => {
    set({ singleMode });
  },
  setMouseMirror: (mouseMirror) => {
    set({ mouseMirror });
  },
  setSelectorsVisible: (visible) => {
    set({ selectorsVisible: visible });
  },
  setPosition: (x, y) => {
    set({ x, y });
  },
  setScale: (scale) => {
    set({ scale });
  },

  // 键盘管理方法
  setPressedLeftKeys: (pressedLeftKeys) => {
    set({ pressedLeftKeys });
  },
  setPressedRightKeys: (pressedRightKeys) => {
    set({ pressedRightKeys });
  },
  setSupportedLeftKeys: (supportedLeftKeys) => {
    set({ supportedLeftKeys });
  },
  setSupportedRightKeys: (supportedRightKeys) => {
    set({ supportedRightKeys });
  },

  setMousePressed: (mousePressed) => {
    set({ mousePressed });
  },
  setMousePosition: (x, y) => {
    set({ mousePosition: { x, y } });
  },
  setCurrentModelPath: (currentModelPath) => {
    set({ currentModelPath });
  },
  setBackgroundImage: (backgroundImage) => {
    set({ backgroundImage });
  },
  setSelectedMotion: (selectedMotion) => {
    set({ selectedMotion });
  },
  setAvailableMotions: (motions) => {
    set({ availableMotions: motions });
  },
  setSelectedExpression: (selectedExpression) => {
    set({ selectedExpression });
  },
  setAvailableExpressions: (expressions) => {
    set({ availableExpressions: expressions });
  }
}));
