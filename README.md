# MathLearningTool

> 高数函数图像解题工具 — 基于 UniApp(Vue3) + DeepSeek AI + GeoGebra

## 项目简介

MathLearningTool 是一款面向高等数学学习者的智能学习工具，结合 AI 智能解题与 GeoGebra 动态几何，帮助用户在解题的同时直观理解函数图像。

## 核心功能

- **AI 对话解题**：输入数学问题，AI 输出完整解题过程 + LaTeX 公式渲染 + 函数图像可绘性判断
- **GeoGebra 交互**：将 AI 识别的函数表达式一键发送至 GeoGebra，交互式探索函数图像
- **解题过程总结**：一键生成适合手写的完整书面解题步骤
- **历史对话持久化**：自动保存对话记录，支持随时切换历史会话

## 技术栈

- **框架**：UniApp（Vue 3 + Vite）
- **AI 对话**：DeepSeek API（支持自定义 API Key 和默认 Key 配置）
- **数学绘图**：GeoGebra（本地离线部署，支持 H5/小程序）
- **LaTeX 渲染**：KaTeX（H5 端）、mp-html（小程序端）
- **状态管理**：Pinia
- **存储**：localStorage / uni.setStorageSync

## 项目结构

```
MathLearningTool/
├── LocalGeoGebraServer/   # GeoGebra 本地部署服务器（独立目录）
│   ├── GeoGebra/          # GeoGebra 离线 bundle
│   ├── geogebra.html      # GeoGebra 中间页
│   ├── start_server.bat   # Windows 启动脚本
│   └── start_server.sh    # Linux/Mac 启动脚本
├── AiPlanning/            # AI 生成规划文档
│   └── PRD-MathLearningTool-v1.0.md
├── src/                   # UniApp 源代码
│   ├── components/        # Vue 组件
│   ├── pages/            # 页面
│   ├── stores/           # Pinia 状态管理
│   ├── services/         # 服务层（AI、存储、解析）
│   ├── static/          # 静态资源
│   └── utils/           # 工具函数
├── .env                  # 环境变量配置（自建，参考 .env.example）
├── .env.example          # 环境变量示例
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd MathLearningTool
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env`：
- `VITE_DEEPSEEK_DEFAULT_API_KEY`：设置默认 API Key（可选，用户可在应用内覆盖）
- `VITE_DEEPSEEK_MODEL`：DeepSeek 模型（默认 `deepseek-chat`）
- `VITE_GEOGEBRA_SERVER_URL`：GeoGebra 服务器地址（见下方部署说明）

### 3. 启动开发服务器

```bash
# H5 端（浏览器）
npm run dev:h5

# 微信小程序端（需要微信开发者工具）
npm run dev:mp-weixin
```

## GeoGebra 本地部署

GeoGebra 相关文件已独立到 `LocalGeoGebraServer/` 目录，支持独立部署。

### 方式一：使用独立 GeoGebra 服务器（推荐）

1. **启动 GeoGebra 本地服务器**：

   **Windows**：
   ```bash
   cd LocalGeoGebraServer
   start_server.bat
   ```

   **Linux/Mac**：
   ```bash
   cd LocalGeoGebraServer
   chmod +x start_server.sh
   ./start_server.sh
   ```

2. **配置环境变量**：

   在 `.env` 中设置：
   ```
   VITE_GEOGEBRA_SERVER_URL=http://localhost:8080/geogebra.html
   ```

3. **访问测试**：

   浏览器访问 `http://localhost:8080/geogebra.html`，应看到 GeoGebra 绘图界面。

### 方式二：集成到 UniApp 项目（离线模式）

如果不想运行独立服务器，可以将 GeoGebra 文件复制到项目 `public/` 目录：

```bash
npm run copy:geogebra
```

然后设置 `.env`：
```
VITE_GEOGEBRA_SERVER_URL=/geogebra/geogebra.html
```

此方式适合 H5 单文件部署，无需额外服务器。

### 部署到生产环境

将 `LocalGeoGebraServer/` 目录部署到任意静态文件服务器（如 Nginx、Apache、OSS 等），然后更新 `.env` 中的 `VITE_GEOGEBRA_SERVER_URL` 为生产环境地址。

**注意**：如果使用独立服务器，需要确保 GeoGebra 页面允许被 iframe 嵌入（X-Frame-Options 设置）。

## 使用说明

1. **初始化**：首次打开应用需要输入 DeepSeek API Key
2. **对话解题**：输入高等数学问题，AI 会返回解题过程
3. **查看函数图像**：如果 AI 判断可绘制图像，点击"发送到 GeoGebra"按钮
4. **交互探索**：在 GeoGebra 界面中交互式调整函数参数

## 构建生产版本

```bash
# H5 端
npm run build:h5

# 微信小程序端
npm run build:mp-weixin
```

构建产物：
- H5：`dist/build/h5/`
- 微信小程序：`dist/build/mp-weixin/`

## 日志系统

项目已集成详细的前后端日志系统，方便调试 GeoGebra 交互过程：

### 前端日志（浏览器控制台）

- `[GeoGebraWebView]` - 组件生命周期、表达式变化、iframe 加载、postMessage 发送
- `[GeoGebraStore]` - 状态变化（setPending/clearPending）
- `[AIResponseParser]` - AI 响应解析过程
- `[ChatStore]` - sendToGeoGebra 调用过程
- `[GeoToolPage]` - 页面生命周期（onShow/onHide）

### 后端日志（GeoGebra iframe 控制台）

- `[GeoGebra-Backend]` - 页面加载、applet 初始化、接收消息、执行命令、错误/警告

### 查看日志

1. 运行项目：`npm run dev:h5`
2. 打开浏览器，按 **F12** 打开开发者工具
3. 切换到 **Console** 标签页查看日志

## 常见问题

### 1. GeoGebra 页面无法加载

- 检查 `VITE_GEOGEBRA_SERVER_URL` 配置是否正确
- 检查 GeoGebra 服务器是否正常运行
- 检查浏览器控制台是否有 CORS 错误（需要配置跨域头）

### 2. LaTeX 公式未渲染

- 检查 KaTeX 依赖是否正确安装：`npm install katex`
- 检查浏览器控制台是否有 KaTeX 相关错误

### 3. Tab 切换时 GeoGebra 状态丢失

- 已修复：移除了 iframe 的 `:key` 绑定，使用 `postMessage` 通信
- 确保 GeoGebra 页面不会在 Tab 切换时被卸载

### 4. 点击"发送到 GeoGebra"无反应

- 检查浏览器控制台日志（`[ChatStore]` 和 `[GeoGebraWebView]`）
- 确认最后一条 AI 消息包含函数表达式
- 确认 GeoGebra 服务器正在运行

## 开发文档

- [PRD 产品需求文档 v1.0](./AiPlanning/PRD-MathLearningTool-v1.0.md)
- [开发文档 v1.3](./AiPlanning/)

## 更新日志

### v1.0 (2026-06-07)
- ✅ 实现 AI 对话解题功能（DeepSeek API 集成）
- ✅ 集成 GeoGebra 本地离线部署
- ✅ 实现 LaTeX 公式渲染（KaTeX + mp-html）
- ✅ 实现对话历史持久化（localStorage）
- ✅ 实现总结面板功能
- ✅ 修复 Tab 切换时 GeoGebra 状态丢失问题
- ✅ 添加详细的前后端日志系统
- ✅ 将 GeoGebra 部署文件独立到 `LocalGeoGebraServer/`
- ✅ 支持默认 API Key 配置（.env 中设置）
- ✅ 修复 LaTeX 解析和 GeoGebra 函数表达式转换
