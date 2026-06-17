# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Principles
- **Strict Adherence to Docs**: Always follow the requirements, technical design, and API specifications in the `docs/` directory.
- **No Scope Creep**: Do not implement any features or functionality not explicitly defined in the requirements document (`docs/需求文档.md`).
- **Implementation Consistency**: Ensure code implementation matches the technical design and API definitions exactly.

## Project Overview
MikMok is a short-video sharing and recommendation platform similar to TikTok. It features full-screen snap-scroll video browsing, heat-based recommendations (likes), personal video management, and an admin monitoring dashboard.

## Tech Stack
- **Frontend**: React 18 (Vite), Tailwind CSS, TanStack Query
- **Backend**: Spring Boot 3.x (Java 17+), Spring Security, JWT
- **Database**: PostgreSQL 15
- **Cache/Ranking**: Redis 7 (ZSet for rankings, Set for watched history)
- **Storage**: MinIO (Object Storage for video files)
- **Deployment**: Docker Compose (Hybrid Mode: Infra on Cloud, Apps on Local)

## Architecture & Core Logic
- **Recommendation (C-Plan)**: 
  1. Fetch Top-N video IDs from Redis ZSet (`mikmok:video:rank`).
  2. Filter out IDs present in user's watched Set (`mikmok:user:watched:{uid}`).
  3. Return paginated video details from PostgreSQL.
- **Monitoring (AOP)**: 
  - Uses Spring AOP to intercept `@RestController` methods.
  - Records request/response bodies and execution duration.
  - Asynchronously persists logs to PostgreSQL `system_logs` table.
- **Storage**: Videos are stored in MinIO; PostgreSQL stores the access URLs.

## Development Environment
- **Infrastructure**: Cloud-based infrastructure (PostgreSQL, Redis, MinIO) is **pre-provided** and managed externally. Developers do not need to start or manage these services.
- **Development Mode**: Both Frontend and Backend are developed and run **inside Docker containers** by default.
- **Connectivity**: Local containers connect to the Cloud Infra using the `SERVER_IP` and credentials defined in the `.env` file.

## Development Commands

### Application Management (Docker-based)
- **Start Full Stack**: `docker-compose up --build -d`
- **Stop All**: `docker-compose down`
- **View Backend Logs**: `docker-compose logs -f backend`
- **View Frontend Logs**: `docker-compose logs -f frontend`
- **Rebuild & Restart Backend**: `docker-compose up -d --build backend`

### Manual Commands (Inside Containers or for CI)
- **Backend Build & Check**: `./mvnw clean compile`
- **Frontend Build & Check**: `npm run build`

## Git Commit Guidelines
- **Pre-commit Check**: Always run build/compile checks locally before committing to ensure no syntax or build errors.
- **Language**: Use **Chinese** for all commit messages.
- **Format**: Do not include co-author information (e.g., "Co-Authored-By").
- **Style**: Use clear, concise Chinese descriptions (e.g., "feat: 实现视频点赞功能", "fix: 修复登录接口耗时统计错误").

## Key Files & Directories
- `docs/`: Project documentation (Requirements, Technical Design, API Docs).
- `docker-compose.infra.yml`: Infrastructure deployment for cloud servers.
- `docker-compose.yml`: Local development orchestration.
- `backend/`: Spring Boot source code.
- `frontend/`: React source code.
