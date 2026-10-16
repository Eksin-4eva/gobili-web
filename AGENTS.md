# AGENTS.md

## 项目概述

gobili-web 是 gobili 视频站后端的 React 配套前端。

## 技术栈

- Vite + React 19 + TypeScript
- pnpm
- Tailwind CSS v4
- shadcn 风格组件（源码在 `src/components/ui`）
- React Router 7 + vite-plugin-pages（文件路由）
- TanStack Query
- React Hook Form + Zod

## 目录约定

- 新页面：只在 `src/pages/` 建文件，不要手写 Route 注册
- 新接口：`src/api/<domain>.ts`，统一走 `src/api/request.ts`
- 基础 UI：`src/components/ui`
- 业务组件：`src/components/<Name>/`
- 禁止 `any`

## 鉴权约定

- 请求头：`Authorization`（access）、`Refresh-Token`
- 响应头：`Access-Token`、`Refresh-Token`（需回写本地）
- 多数写接口使用 `application/x-www-form-urlencoded`
- 上传接口使用 `multipart/form-data`

## 开发命令

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```
