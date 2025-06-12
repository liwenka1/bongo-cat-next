# BongoCat Next

一个使用 Next.js + Tauri 技术栈重新实现的桌面宠物应用，灵感来源于 [BongoCat](https://github.com/ayangweb/BongoCat) 项目。

## 功能特性

- 🐱 桌面宠物显示
- ⌨️ 键盘按键响应
- 🖱️ 鼠标点击响应  
- 🎨 Live2D 模型支持 (开发中)
- ⚙️ 丰富的个性化设置
- 🖼️ 透明窗口支持
- 📌 总在最前显示
- 🔄 镜像模式
- 👻 点击穿透模式

## 技术栈

### 前端
- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Ant Design React** - UI 组件库
- **Zustand** - 状态管理
- **PIXI.js v6** - 2D 渲染引擎
- **pixi-live2d-display** - Live2D 模型显示

### 后端
- **Tauri 2** - 跨平台桌面应用框架
- **Rust** - 系统级编程
- **rdev** - 键鼠事件监听

## 开发状态

### ✅ 已完成
- [x] 项目基础架构搭建
- [x] Tauri + Next.js 集成
- [x] 状态管理 (Zustand)
- [x] 设备事件监听 (键盘/鼠标)
- [x] 多窗口管理 (主窗口/设置窗口)
- [x] 基础 UI 组件
- [x] 透明窗口支持
- [x] 窗口拖拽功能
- [x] 设置页面完整 UI

### 🚧 开发中
- [ ] Live2D 模型完整集成
- [ ] PIXI.js v6 API 适配
- [ ] 模型文件管理
- [ ] 动画系统

### 📋 待实现
- [ ] 自定义模型导入
- [ ] 键盘按键可视化
- [ ] 右键菜单
- [ ] 托盘图标
- [ ] 自启动功能
- [ ] 模型热更新
- [ ] 性能优化

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- pnpm

## 安装依赖

```bash
pnpm install
```

## 开发运行

```bash
# 启动开发服务器
pnpm dev

# 运行 Tauri 开发模式
pnpm tauri dev
```

## 构建

```bash
# 构建前端
pnpm build

# 构建 Tauri 应用
pnpm tauri build
```

## 项目结构

```
bongo-cat-next/
├── src/                    # Next.js 前端代码
│   ├── app/               # App Router 页面
│   │   ├── page.tsx       # 主窗口页面
│   │   ├── settings/      # 设置页面
│   │   └── layout.tsx     # 根布局
│   ├── components/        # React 组件
│   │   └── Live2DViewer.tsx
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useDeviceEvents.ts
│   │   ├── useKeyboard.ts
│   │   └── useMouse.ts
│   ├── stores/            # Zustand 状态管理
│   │   └── catStore.ts
│   └── styles/            # 样式文件
│       └── globals.css
├── src-tauri/             # Tauri Rust 后端
│   ├── src/
│   │   ├── lib.rs         # 主入口
│   │   └── device.rs      # 设备监听
│   ├── Cargo.toml         # Rust 依赖配置
│   └── tauri.conf.json    # Tauri 应用配置
├── package.json           # Node.js 依赖配置
└── README.md
```

## 配置说明

### 窗口配置
- **主窗口**: 透明、无边框、总在最前、可拖拽
- **设置窗口**: 标准窗口、可调整大小、居中显示

### 设备监听
- 全局键盘事件监听
- 全局鼠标事件监听
- 事件通过 Tauri 事件系统传递到前端

## 与原版 BongoCat 的区别

| 特性 | BongoCat (Vue + Tauri) | BongoCat Next (Next.js + Tauri) |
|------|------------------------|----------------------------------|
| 前端框架 | Vue 3 | Next.js 15 |
| 状态管理 | Pinia | Zustand |
| 样式方案 | UnoCSS | Tailwind CSS |
| UI 组件 | Ant Design Vue | Ant Design React |
| 构建工具 | Vite | Next.js |
| 类型安全 | TypeScript | TypeScript |

## 开发规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- Git 提交遵循 Conventional Commits

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 致谢

感谢 [ayangweb](https://github.com/ayangweb) 开发的原版 [BongoCat](https://github.com/ayangweb/BongoCat) 项目提供的灵感和参考。
