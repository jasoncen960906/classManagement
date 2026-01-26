<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartClass Assistant

這是一個基於 React + Vite 開發的智慧課堂管理工具。

原始專案：[AI Studio App](https://ai.studio/apps/drive/1JjVsRTwvrElo_GZnHfpTK4E14nUk1nts)

## ✨ 功能特色

- **學生名冊管理**：支援 CSV 匯入 (兼容 Excel 中文編碼) 與手動新增。
- **隨機點名**：支援重複/不重複抽取，並帶有動畫效果。
- **自動分組**：快速將學生隨機分組並可匯出結果。

## 🚀 快速開始

### 環境需求

- Node.js (推薦 v18 或以上)

### 安裝與執行

1. 安裝相依套件：
   ```bash
   npm install
   ```

2. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 📦 部署 (GitHub Actions)

本專案已設定 GitHub Actions 自動部署至 GitHub Pages。

1. **自動部署**：
   - 當您 push 程式碼到 `main` 分支時，GitHub Actions 會自動建置並部署。
   - 部署完成後，請至 `Settings` > `Pages` 確認 Source 是否設定為 `gh-pages` 分支。

## 🛠️ 技術棧

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Lucide React Icons

## 📂 專案結構說明

- `.github/workflows`: 自動化部署流程設定
- `.gitignore`: 排除不必要的檔案 (node_modules, secrets, etc.)
- `src`: 原始碼目錄
  - `utils`: 工具函式 (CSV 解析等)
