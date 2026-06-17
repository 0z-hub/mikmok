# mikmok

全栈视频管理平台：后端（Spring Boot）+ 前端（React + Vite）。

## 项目结构

- `backend/` — 后端服务
- `frontend/` — 前端应用（登录、发布、视频管理）
- `docs/` — 技术设计与 API 文档

## 前端开发

```bash
cd frontend
npm install
npm run dev
```

默认访问 http://localhost:5173

环境变量：在 `frontend/` 目录创建 `.env.local`，配置 `VITE_API_BASE_URL`（本地开发配合 Vite 代理可留空）。

## 后端开发

详见 `backend/` 目录及 `docs/` 文档。

## Docker 一键启动

```bash
docker-compose up -d
```
