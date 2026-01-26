<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SmartClass Assistant

這是一個基於 React + Vite 開發的智慧課堂管理工具，整合 Gemini AI 進行智慧出題。

原始專案：[AI Studio App](https://ai.studio/apps/drive/1JjVsRTwvrElo_GZnHfpTK4E14nUk1nts)

## ✨ 功能特色

- **學生名冊管理**：支援 CSV 匯入 (兼容 Excel 中文編碼) 與手動新增。
- **隨機點名**：支援重複/不重複抽取，並帶有動畫效果。
- **AI 智能出題**：結合 Google Gemini AI，根據設定的主題自動生成相關問題。
- **自動分組**：快速將學生隨機分組並可匯出結果。

## 🚀 快速開始

### 環境需求

- Node.js (推薦 v18 或以上)

### 安裝與執行

1. 安裝相依套件：
   ```bash
   npm install
   ```

2. 設定環境變數：
   - 複製 `.env.example` 為 `.env`
     ```bash
     cp .env.example .env
     ```
   - 在 `.env` 中填入您的 Gemini API Key：
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 📦 部署 (GitHub Actions)

本專案已設定 GitHub Actions 自動部署至 GitHub Pages。

1. **設定 Secret**：
   - 進入 GitHub Repository 的 `Settings` > `Secrets and variables` > `Actions`
   - 新增 Repository secret：
     - Name: `GEMINI_API_KEY`
     - Value: 您的 Gemini API Key

2. **自動部署**：
   - 當您 push 程式碼到 `main` 分支時，GitHub Actions 會自動建置並部署。
   - 部署完成後，請至 `Settings` > `Pages` 確認 Source 是否設定為 `gh-pages` 分支。

## 🛠️ 技術棧

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Google Gemini AI SDK
- Lucide React Icons

## 📂 專案結構說明

- `.github/workflows`: 自動化部署流程設定
- `.gitignore`: 排除不必要的檔案 (node_modules, secrets, etc.)
- `src`: 原始碼目錄
  - `services`: AI 服務整合
  - `utils`: 工具函式 (CSV 解析等)
