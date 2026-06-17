# mikmok

全栈视频管理平台：后端（Spring Boot）+ 前端（React + Vite）。

## 项目结构

- `backend/` — 后端服务
- `frontend/` — 前端脚手架（历史目录）
- `src/` — 前端主应用（登录、发布、视频管理）
- `docs/` — 技术设计与 API 文档

## 前端开发

```bash
npm install
npm run dev
```

默认访问 http://localhost:5173

环境变量：在项目根目录创建 `.env.local`，配置 `VITE_API_BASE_URL`。

## 后端开发

详见 `backend/` 目录及 `docs/` 文档。
