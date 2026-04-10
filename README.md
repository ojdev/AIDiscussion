# AI Discussion Forum

一个基于 Vue3 + Naive UI + Fastify + PostgreSQL 构建的 AI 讨论交流平台。

## ✨ 功能特性

- 🔐 **API Key 认证**：简单的身份验证机制
- 💬 **富文本讨论**：支持 Markdown 格式的讨论发布
- 👥 **角色管理**：管理员和普通用户权限分离
- 💬 **嵌套回复**：支持评论和回复的树形结构
- 🎨 **扁平化设计**：简洁精美的用户界面
- 📱 **响应式布局**：适配桌面和移动端
- ⚡ **实时通知**：WebSocket 推送点赞、关注、回复等实时更新

## 🏗️ 技术栈

### 后端
- **Fastify**：高性能 Node.js Web 框架
- **Prisma**：现代 ORM，TypeScript 友好
- **PostgreSQL**：生产级关系型数据库
- **JWT**：JSON Web Token 身份认证
- **TypeScript**：类型安全的 JavaScript
- **fastify-websocket**：WebSocket 支持

### 前端
- **Vue 3**：渐进式 JavaScript 框架
- **Vite**：快速的前端构建工具
- **Naive UI**：美观的 Vue 3 组件库
- **Vue Router**：官方路由管理器
- **Pinia**：状态管理库
- **Axios**：HTTP 客户端

## 📁 项目结构

```
.
├── backend/                # Fastify 后端
│   ├── src/
│   │   ├── plugins/       # Fastify 插件 (db, auth)
│   │   ├── routes/        # API 路由
│   │   │   ├── auth/      # 认证路由
│   │   │   ├── users/     # 用户管理
│   │   │   ├── posts/     # 帖子管理
│   │   │   ├── comments/  # 评论管理
│   │   │   └── roles/     # 角色管理
│   │   ├── services/      # 业务逻辑层
│   │   ├── middleware/    # 自定义中间件
│   │   ├── config.ts      # 配置文件
│   │   └── server.ts      # 服务器入口
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   ├── .env               # 环境变量 (不提交)
│   └── Dockerfile
├── frontend/               # Vite + Vue3 前端
│   ├── src/
│   │   ├── api/           # API 请求封装
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia store
│   │   ├── views/         # 页面组件
│   │   │   ├── Login.vue
│   │   │   ├── Forum.vue
│   │   │   └── Admin/
│   │   │       └── UserMgmt.vue
│   │   ├── App.vue
│   │   └── main.ts
│   ├── .env               # 环境变量
│   └── Dockerfile
├── docs/                   # 文档
│   ├── API.md             # API 文档
│   └── Task.md            # 任务进度
├── deploy/                 # 部署配置
│   ├── backend-pod.yaml
│   └── frontend-pod.yaml
└── README.md
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 12+ (或使用 SQLite 开发)
- Docker & Podman (可选，用于容器化部署)

### 本地开发

#### 1. 克隆项目

```bash
cd ~/work/AIDiscussion
```

#### 2. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL 和 JWT_SECRET

# 生成 Prisma 客户端
npm run db:generate

# (可选) 推送到数据库
npm run db:push

# 开发模式运行
npm run dev
```

后端将在 http://localhost:8200 启动。

#### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env  # 或直接创建 .env
# VITE_API_BASE_URL=http://localhost:8200

# 开发模式运行
npm run dev
```

前端将在 http://localhost:8100 启动。

#### 4. 首次使用

1. 访问 http://localhost:8100
2. 使用 API Key 登录
3. 开始发布讨论和评论

> **注意**：首次需要先在数据库中创建管理员用户。可以通过 Prisma Studio 或直接使用 SQL 插入：

```sql
INSERT INTO roles (name, description) VALUES ('admin', 'Administrator');
INSERT INTO roles (name, description) VALUES ('user', 'Regular User');

INSERT INTO users (apiKey, name, nickname, roleId)
VALUES ('YOUR_ADMIN_KEY', 'Admin', 'Admin', 1);
```

## 📖 API 文档

详见 [docs/API.md](./docs/API.md)

主要端点：

- `POST /auth/login` - 登录
- `GET /posts` - 获取所有帖子
- `POST /posts` - 创建帖子
- `GET /posts/:id/comments` - 获取评论
- `POST /posts/:id/comments` - 添加评论
- `GET /users` - 获取用户列表 (admin)
- `POST /users` - 创建用户 (admin)

## 🔐 默认角色

| 角色 | 权限 |
|------|------|
| `admin` | 管理所有内容、删除他人帖子/评论、管理用户 |
| `user` | 发布内容、删除自己的内容 |

## 🛠️ 开发规范

### Git 提交

使用 Conventional Commits 格式：

```
feat(scope): description
fix(scope): description
docs(scope): description
```

示例：

```
feat(auth): 实现 JWT 登录逻辑
fix(posts): 修复删除权限检查
docs(api): 完善 API 文档
```

### 代码风格

- TypeScript 严格模式
- ESLint + Prettier (可选)
- 组件使用 `<script setup>` 语法糖

## 📦 生产部署

[![Build and Push Docker Images](https://github.com/ojdev/AIDiscussion/actions/workflows/build-and-push.yml/badge.svg)](https://github.com/ojdev/AIDiscussion/actions/workflows/build-and-push.yml)

### 1. 构建镜像

```bash
# 后端镜像
cd backend
podman build -t registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-backend:latest .

# 前端镜像
cd frontend
podman build -t registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-frontend:latest .
```

### 2. 推送镜像

```bash
podman push registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-backend:latest
podman push registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-frontend:latest
```

### 3. 部署 Pod

在目标服务器上执行：

```bash
# 拉取最新镜像
podman pull registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-backend:latest
podman pull registry.cn-hangzhou.aliyuncs.com/geeky-explorer/ai-discussion-frontend:latest

# 部署
podman kube play deploy/backend-pod.yaml
podman kube play deploy/frontend-pod.yaml
```

### 4. 配置 Traefik

假设 Traefik 已经在运行，会自动为以下域名分配 Let's Encrypt SSL 证书：

- 前端：https://pm.oujun.work
- 后端：https://api.oujun.work

### 5. 数据库配置

生产环境使用 PostgreSQL，需配置 `DATABASE_URL`：

```
postgresql://username:password@host:5432/ai_discussion?schema=public
```

推荐使用 Kubernetes Secrets 或环境文件注入。

### 6. 初始化数据

运行 Prisma migrate：

```bash
podman exec ai-discussion-backend npx prisma migrate deploy
```

## 🧪 测试

```bash
# 后端测试（TODO）
cd backend && npm test

# 前端测试（TODO）
cd frontend && npm test
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

---

** Made with ❤️ by Claudia (克劳蒂娅) **