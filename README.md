# MathLearningTool

> 高数函数图像解题工具 — 基于 UniApp 微信小程序

## AI项目

## 项目简介

MathLearningTool 是一款面向高等数学学习者的微信小程序，结合 AI 智能解题与 GeoGebra 动态几何，帮助用户在解题的同时直观理解函数图像。

## 核心功能

- **AI 对话解题**：输入数学问题，AI 输出完整解题过程 + LaTeX 公式渲染 + 函数图像可绘性判断
- **GeoGebra 交互**：将 AI 识别的函数表达式一键发送至 GeoGebra，交互式探索函数图像
- **解题过程总结**：一键生成适合手写的完整书面解题步骤
- **历史对话持久化**：自动保存对话记录，支持随时切换历史会话

## 技术栈

- **框架**：UniApp（编译为微信小程序）
- **AI 对话**：大模型 API（待定）
- **数学绘图**：GeoGebra（WebView 嵌入）
- **LaTeX 渲染**：KaTeX / mp-html

## 项目结构

```
MathLearningTool/
├── AiPlaning/              # AI 生成规划文档
│   └── PRD-MathLearningTool-v1.0.md
├── src/                    # 源代码（待创建）
└── README.md
```

## 文档

- [PRD 产品需求文档 v1.0](./AiPlaning/PRD-MathLearningTool-v1.0.md)
