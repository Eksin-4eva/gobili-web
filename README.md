# gobili-web

gobili 视频站的 Web 前端。
后端repo地址 https://github.com/Eksin-4eva/GoWork4

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router（`vite-plugin-pages` 文件路由）
- TanStack Query
- React Hook Form + Zod

## 功能

- 推荐 Feed / 热门榜 / 搜索
- 注册登录（双 Token）
- 视频投稿（封面可选）
- 视频详情、播放计数
- 评论 / 回复 / 删除
- 个人主页、头像上传、MFA
- 私信（WebSocket）

## 本地启动

先启动后端 `gobili`（默认 API `8888`，聊天 `8889`），再启动前端：

```bash
pnpm install   # 或 npm install
pnpm dev       # 或 npm run dev
```

浏览器打开 http://127.0.0.1:5173

开发环境通过 Vite 代理转发接口：

| 路径 | 目标 |
|---|---|
| `/user` `/video` `/comment` `/auth` | `http://127.0.0.1:8888` |
| `/ws` `/history` | `http://127.0.0.1:8889` |

可在 `.env` 中覆盖：

```bash
VITE_API_BASE_URL=
VITE_CHAT_BASE_URL=
VITE_CHAT_WS_URL=
```

## 脚本

```bash
pnpm dev         # 开发
pnpm build       # 类型检查 + 构建
pnpm lint        # ESLint
pnpm typecheck   # 仅 TypeScript
```

## 目录

```
src/
├── api/           # 请求封装与接口
├── components/    # UI 与业务组件
├── hooks/         # 自定义 Hook
├── lib/           # session / utils 等
├── pages/         # 页面（文件路由）
└── types/         # 类型定义
```

## 说明

- 鉴权请求头：`Authorization`、`Refresh-Token`
- 鉴权响应头：`Access-Token`、`Refresh-Token`（需回写本地）
- 后端暂无单视频详情接口，详情页依赖列表跳转时的缓存数据
