<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartClass Assistant

这是一个基于 React + Vite 开发的智慧课堂管理工具。

原始项目：[AI Studio App](https://ai.studio/apps/drive/1JjVsRTwvrElo_GZnHfpTK4E14nUk1nts)

## ✨ 功能特色

- **学生名册管理**：支持 CSV 导入 (兼容 Excel 中文编码) 与手动新增。
- **随机点名**：支持重复/不重复抽取，并带有动画效果。
- **自动分组**：快速将学生随机分组并可导出结果。

## 🚀 快速开始

### 环境需求

- Node.js (推荐 v18 或以上)

### 安装与执行

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 📦 部署 (GitHub Actions)

本项目已设定 GitHub Actions 自动部署至 GitHub Pages。

1. **自动部署**：
   - 当您 push 代码到 `main` 分支时，GitHub Actions 会自动构建并部署。
   - 部署完成后，请至 `Settings` > `Pages` 确认 Source 是否设定为 `gh-pages` 分支。

## 🛠️ 技术栈

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Lucide React Icons

## 📂 项目结构说明

- `.github/workflows`: 自动化部署流程设定
- `.gitignore`: 排除不必要的文件 (node_modules, secrets, etc.)
- `src`: 源码目录
  - `utils`: 工具函数 (CSV 解析等)
