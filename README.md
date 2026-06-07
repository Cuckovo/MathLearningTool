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
├── LocalGeoGebraServer/     # GeoGebra 本地部署目录（需手动初始化，不纳入 git）
│   ├── GeoGebra/           # ⬇️ 需手动下载（见下方部署说明）
│   ├── geogebra.html       # GeoGebra 中间页（已包含）
│   ├── start_server.bat    # Windows 启动脚本
│   └── start_server.sh     # Linux/Mac 启动脚本
├── AiPlanning/             # AI 生成规划文档
├── src/                    # UniApp 源代码
│   ├── components/         # Vue 组件
│   ├── pages/              # 页面
│   ├── stores/             # Pinia 状态管理
│   ├── services/           # 服务层（AI、存储、解析）
│   └── utils/              # 工具函数
├── .env                    # 环境变量配置（自建，参考 .env.example）
└── .env.example            # 环境变量示例
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

### 3. 部署 GeoGebra 本地服务器

> ⚠️ GeoGebra 离线 bundle 文件量大（~80MB），不纳入 git 版本管理，需手动部署。

#### 步骤 1：下载 GeoGebra 离线包

从 GeoGebra 官方下载 HTML5 离线部署包：

```bash
# 方式 A：从 GitHub 下载（推荐）
# 访问 https://github.com/geogebra/geogebra/releases
# 下载最新的 HTML5 离线包

# 方式 B：从 npm 获取
npm install geogebra-api
# 然后从 node_modules/geogebra-api/ 中拷贝 GeoGebra/ 目录
```

#### 步骤 2：放置文件

将下载的 `GeoGebra/` 目录放入 `LocalGeoGebraServer/` 下：

```
LocalGeoGebraServer/
├── GeoGebra/                    # ⬇️ 从离线包获取
│   ├── deployggb.js             # GeoGebra 部署脚本
│   └── HTML5/
│       └── 5.0/
│           ├── web3d/           # 图形计算器模式使用的资源
│           └── webSimple/       # 简化模式使用的资源
├── geogebra.html                # ✅ 已包含（中间页）
├── start_server.bat             # ✅ 已包含（Windows 启动脚本）
└── start_server.sh              # ✅ 已包含（Linux/Mac 启动脚本）
```

> **关键文件**：`GeoGebra/deployggb.js` 和 `GeoGebra/HTML5/5.0/web3d/` 目录必须存在，否则 GeoGebra 无法离线运行。

#### 步骤 3：启动 GeoGebra 服务器

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

> 启动脚本使用 Python 内置 HTTP 服务器，需本机已安装 Python 3。
> 服务器启动后访问 `http://localhost:8080/geogebra.html`，应看到 GeoGebra 绘图界面。

#### 步骤 4：配置项目环境变量

在项目根目录的 `.env` 中设置：

```env
VITE_GEOGEBRA_SERVER_URL=http://localhost:8080/geogebra.html
```

### 4. 启动开发服务器

```bash
# H5 端（浏览器）
npm run dev:h5

# 微信小程序端（需要微信开发者工具）
npm run dev:mp-weixin
```

## GeoGebra 部署方式说明

### 方式一：独立本地服务器（推荐开发用）

按照上方「部署 GeoGebra 本地服务器」步骤操作。适合开发调试，支持热更新和日志查看。

### 方式二：生产环境部署

将 `LocalGeoGebraServer/` 目录部署到静态文件服务器（Nginx、Apache、OSS 等），然后更新 `.env`：

```env
VITE_GEOGEBRA_SERVER_URL=https://your-domain.com/geogebra.html
```

**注意**：
- 生产环境需配置 CORS 允许 iframe 跨域嵌入
- 需设置 `X-Frame-Options` 允许应用域名
- Nginx 示例配置：
  ```nginx
  location /geogebra/ {
      alias /path/to/LocalGeoGebraServer/;
      add_header Access-Control-Allow-Origin *;
      add_header X-Frame-Options "ALLOW-FROM https://your-app-domain.com";
  }
  ```

### 方式三：使用在线 GeoGebra（最简部署）

如果不需要离线功能，可直接使用 GeoGebra 官方在线服务：

```env
# ⚠️ 在线模式需要网络连接，且可能受限于官方服务可用性
VITE_GEOGEBRA_SERVER_URL=https://www.geogebra.org/graphing
```

## 使用说明

1. **初始化**：首次打开应用需要输入 DeepSeek API Key（或在 `.env` 中预配置）
2. **对话解题**：输入高等数学问题，AI 会返回解题过程
3. **查看函数图像**：如果 AI 判断可绘制图像，点击「发送到 GeoGebra」按钮
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

| 日志前缀 | 内容 |
|---------|------|
| `[GeoGebraWebView]` | 组件生命周期、表达式变化、iframe 加载、postMessage 发送 |
| `[GeoGebraStore]` | 状态变化（setPending/clearPending） |
| `[AIResponseParser]` | AI 响应解析过程（LaTeX 提取 → GeoGebra 转换） |
| `[ChatStore]` | sendToGeoGebra 调用过程 |
| `[GeoToolPage]` | 页面生命周期（onShow/onHide） |

### 后端日志（GeoGebra iframe 控制台）

| 日志前缀 | 内容 |
|---------|------|
| `[GeoGebra-Backend]` | 页面加载、applet 初始化、接收消息、执行命令 |
| `[GeoGebra-Backend] [WARN]` | 非致命警告（如重试） |
| `[GeoGebra-Backend] [ERROR]` | 致命错误（如表达式无法绘制） |

### 查看日志

1. 运行项目：`npm run dev:h5`
2. 打开浏览器，按 **F12** 打开开发者工具
3. 切换到 **Console** 标签页查看日志
4. 如需查看 GeoGebra 后端日志，需在 iframe 控制台（Elements → iframe → console）中查看

## 常见问题

### 1. GeoGebra 页面无法加载

- 检查 `VITE_GEOGEBRA_SERVER_URL` 配置是否正确
- 检查 GeoGebra 服务器是否正常运行：访问 `http://localhost:8080/geogebra.html`
- 检查 `LocalGeoGebraServer/GeoGebra/` 目录是否存在且包含 `deployggb.js`
- 检查浏览器控制台是否有 CORS 错误

### 2. LaTeX 公式未渲染

- 检查 KaTeX 依赖是否正确安装：`npm install katex`
- 检查浏览器控制台是否有 KaTeX 相关错误

### 3. Tab 切换时 GeoGebra 状态丢失

- 已修复：移除了 iframe 的 `:key` 绑定，使用 postMessage 通信
- Tab 切换时 GeoGebra 页面不会被卸载，函数图像状态保留

### 4. 点击「发送到 GeoGebra」无反应

- 打开浏览器控制台查看 `[ChatStore]` 日志
- 确认最后一条 AI 消息包含函数表达式（`hasFunction: true`）
- 确认 GeoGebra 服务器正在运行

### 5. GeoGebra 离线包下载

- GitHub：https://github.com/geogebra/geogebra/releases
- npm：`npm install geogebra-api`，从 `node_modules/geogebra-api/` 中拷贝
- 官方文档：https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/

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
- ✅ GeoGebra 部署文件独立到 LocalGeoGebraServer/（不纳入 git）
- ✅ 支持默认 API Key 配置（.env 中设置）
- ✅ 修复 LaTeX 解析和 GeoGebra 函数表达式转换
