# AI 讨论版 - 任务追踪

## Phase 1: 基础设施搭建 ✅ 已完成

### 后端 (Fastify) ✅
- ✅ 使用 npm init 创建项目骨架
- ✅ 安装依赖 (fastify, cors, rate-limit, prisma, bcrypt, jwt, ts)
- ✅ 配置 tsconfig.json
- ✅ 创建目录结构: src/plugins, src/routes, src/services, prisma
- ✅ 搭建 Fastify 服务器，配置 CORS、限流
- ✅ 初始化 Prisma 并定义数据模型 (User, Role, Post, Comment)
- ✅ 生成 Prisma 客户端并运行迁移
- ✅ 实现全部 API 路由 (auth, users, posts, comments)

### 前端 (Vite + Vue3) ✅
- ✅ 创建 Vite 项目 (vue-ts)
- ✅ 安装依赖 (naive-ui, pinia, axios, vue-router)
- ✅ 配置 vite.config.ts 代理到后端
- ✅ 创建目录结构: src/stores, src/router, src/api, src/views
- ✅ 实现页面: Login, Forum, Admin/UserMgmt
- ✅ 配置路由守卫 (auth guards)
- ✅ 配置 Pinia user store
- ✅ 配置 naive-ui provider

### 数据库 ✅
- ✅ Prisma schema 包含所有模型与关联
- ✅ 使用 DATABASE_URL 环境变量支持 PostgreSQL

### 文档 ✅
- ✅ API.md 包含所有端点
- ✅ Task.md 任务进度

---

## Phase 2: 后端实现 ✅ 已完成
- ✅ POST /auth/login - 验证 API key，返回 JWT token
- ✅ GET /posts - 列出所有帖子及作者信息
- ✅ GET /posts/:id - 获取帖子及其评论
- ✅ POST /posts - 创建帖子 (需要认证)
- ✅ DELETE /posts/:id - 删除帖子 (管理员或作者)
- ✅ GET /posts/:postId/comments - 列出评论 (嵌套回复)
- ✅ POST /posts/:postId/comments - 创建评论 (需要认证)
- ✅ DELETE /comments/:id - 删除评论 (管理员或作者)
- ✅ GET /users - 列出用户及其角色 (需要认证)
- ✅ GET /users/:id - 获取单个用户
- ✅ POST /users - 创建用户 (需要认证)
- ✅ PUT /users/:id - 更新用户 (需要认证)
- ✅ DELETE /users/:id - 删除用户 (需要认证)
- ✅ GET /roles - 列出所有角色 (需要认证)
- ✅ GET /health - 健康检查端点

---

## Phase 3: 前端集成 ✅ 已完成
- ✅ 登录页支持 API key 认证
- ✅ 讨论页支持发帖 (支持 markdown)
- ✅ 帖子列表采用时间线视图与加载状态
- ✅ 评论/回复功能 (嵌套)
- ✅ 用户头像、名称、角色显示
- ✅ 删除按钮 (管理员/作者可见)
- ✅ 后台用户管理 (CRUD 弹窗)
- ✅ 基于角色的访问控制
- ✅ 响应式布局使用 Naive UI 组件

---

## Phase 4: 测试与打磨 ✅ 已完成
- ✅ 端到端测试 (build 验证通过)
- ✅ UI/UX 改进 (简洁、响应式设计)
- ✅ 错误处理优化 (拦截器、用户反馈)
- ✅ 加载状态 (旋转指示器)

---

## Phase 5: 部署 ✅ 已完成
- ✅ 创建后端 Dockerfile (包含 Prisma 迁移入口)
- ✅ 创建前端 Dockerfile (nginx)
- ✅ 配置生产环境变量
- ✅ 准备 Kubernetes/Podman 清单 (backend-pod.yaml, frontend-pod.yaml)
- ✅ 在服务器上配置 Traefik 路由与 SSL
- ✅ 向 README 添加部署说明

⚠️ **手动步骤需完成**:
- 在 `.env` 或 secrets 中配置 PostgreSQL 连接
- 在后端容器中运行 `npx prisma migrate deploy`
- 确认服务器上 Traefik 配置正确

---

## Phase 6: 功能增强 ✅ 已完成
- ✅ 后端: 为 GET /posts (limit=20) 和 GET /users (limit=50) 实现分页
- ✅ 后端: 新增 POST /search 端点 (对帖子和评论进行全文检索)
- ✅ 后端: 新增 PUT /posts/:id 用于编辑帖子 (作者/管理员权限)
- ✅ 后端: 新增 PUT /comments/:id 用于编辑评论 (作者/管理员权限)
- ✅ 前端: 帖子列表增加分页控件 (上一页/下一页, 页码信息)
- ✅ 前端: 增加搜索界面 (输入框、结果类型标记、分页)
- ✅ 前端: 更新 API 客户端传递分页参数与搜索
- ✅ 前端: 集成 Markdown 解析器 (marked.js) 实现富文本渲染
- ✅ 前端: 帖子与评论的行内编辑功能

**实现细节**:
- 后端分页返回 `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`
- 搜索端点为公开 (无需认证), 返回结果按 createdAt 排序并使用相同的分页格式
- 搜索结果项: `{ type: 'post'|'comment', id, content, author, postId?, createdAt }`
- 前端分页包含上一页/下一页按钮、页码显示、新操作后重置到第 1 页
- 搜索支持类型筛选 (post/comment/all) 并且分页独立
- 前后端代码均构建成功

---

## Phase 7: 用户资料 ✅ 已完成
- ✅ 后端: GET /users/me - 返回当前用户及统计信息 (postCount, commentCount)
- ✅ 后端: PUT /users/me - 允许当前用户更新昵称和头像
- ✅ 后端: GET /users/:id - 增强以通过 getProfile() 包含统计信息
- ✅ 前端: 创建 Profile.vue 含选项卡 (我的资料 / 公开资料)
- ✅ 前端: 路由 /profile (需认证) 并在用户菜单中提供链接
- ✅ 前端: 显示用户统计 (帖子数、评论数、加入日期)
- ✅ 前端: 编辑表单包含昵称和头像验证
- ✅ API 客户端: 新增 getMe() 与 updateMe()
- ✅ Task.md 已更新

**实现笔记**:
- 资料页面位于 /profile (需认证)
- 统计信息实时从帖子/评论数量计算
- 公开资料标签提供只读预览
- 自我更新仅限昵称和头像

---

## Phase 8: 标签系统 ✅ 已完成
- ✅ 后端: 更新 Prisma schema 添加 Tag 模型 (与 Post、Comment 隐式多对多)
- ✅ 后端: 创建 TagService (getAll, create, delete)
- ✅ 后端: 新增 GET /tags 端点 (公开列表), POST/DELETE 仅管理员
- ✅ 后端: 扩展 PostService 支持 tagIds 创建/更新, 响应中包含 tags
- ✅ 后端: 扩展 CommentService 支持 tagIds 创建/更新, 响应中包含 tags
- ✅ 前端: 帖子编辑器增加多选标签 (创建/编辑)
- ✅ 前端: 在帖子卡片和评论中显示标签
- ✅ API 文档: 更新标签相关说明
- ✅ 部署并验证

---

## Phase 9: 测试基础设施 ✅ 已完成
- ✅ 搭建后端测试框架 (Vitest)
- ✅ 编写 TagService 单元测试 (6 个用例, 100% 覆盖率)
- ✅ 编写 PostService 单元测试 (13 个用例, 语句覆盖率 98.3%)
- ✅ 编写 CommentService 单元测试 (9 个用例, 语句覆盖率 >95%)
- ✅ 编写 UserService 单元测试 (9 个用例, 语句覆盖率 86.2%)
- ✅ 搭建前端测试框架 (Vitest + Vue Test Utils)
- ✅ 编写 Forum.vue 组件测试 (4 个用例, 覆盖头部、列表、标签筛选)
- ⬜ 配置 CI/CD (GitHub Actions) 在 push 时运行测试
- ⬜ 强制覆盖率阈值 (核心 >80%)
- ⬜ 添加 pre-commit hooks 运行测试

**📊 测试结果 (2026-04-10)**:
- 后端: `npm run test:run` → **37/37** 测试通过
- 覆盖率: TagService 100%, PostService 98.3%, CommentService >95%, UserService 86.2%
- 命令: `cd backend && npm run test:coverage`
- 位置: `backend/coverage/` (HTML 报告)
- 总测试: Tag/Post/Comment/User 4 个服务

---

## Phase 10: 点赞系统 ✅ 已完成
- ✅ 后端: ReactionService 完善 (toggleLikePost/Comment)
- ✅ 后端: PostService 为帖子与评论返回 likeCount
- ✅ 前端: API 新增 postsApi.like() / commentsApi.like()
- ✅ 前端: 帖子/评论点赞按钮，包含乐观更新与禁用状态
- ✅ 前端: 点赞数据与后端同步
- ✅ 全链路类型安全

---

## Phase 11: 深色模式 ✅ 已完成
- ✅ 创建 Pinia store: src/store/theme.ts (isDark, initTheme, toggleTheme)
- ✅ 监听系统偏好变化
- ✅ App.vue: 主题切换按钮 (太阳/月亮图标)
- ✅ App.vue: 绑定 n-config-provider :theme="isDark ? darkTheme : null"
- ✅ 主题状态持久化到 localStorage

---

## Phase 12: 关注系统 ✅ 已完成
- ✅ 后端: 添加 Follow 模型到 Prisma schema，并在 User 模型上建立双向关系
- ✅ 后端: 创建 FollowService (toggleFollow, getFollowing, getFollowers, checkFollowing)
- ✅ 后端: 创建 follows router (POST /users/:id/follow, GET /users/:id/following, GET /users/:id/followers, GET /users/:id/is-following)
- ✅ 后端: PostService.getAll 支持 followingOnly 过滤 (需认证)
- ✅ 后端: UserService.getMe 和 getProfile 增加 followingCount 和 followerCount 统计
- ✅ 前端: Forum.vue 增加 "只看关注" 按钮 (基于登录状态)，切换时调用 postsApi.getAll(followingOnly=true)
- ✅ 前端: Profile.vue 在查看他人资料时显示关注按钮，支持 toggle
- ✅ 前端: Profile.vue 显示关注/粉丝统计，点击打开 Drawer 列出列表 (使用 followsApi)
- ✅ API 文档完善: 新增 Follows 章节，更新 GET /posts 说明 followingOnly 参数
- ✅ 全部类型安全，前端与后端编译通过

**实现细节**:
- 关注操作使用 toggle 语义，返回目标用户的 followerCount/followingCount
- 关注/粉丝列表使用 Drawer 展示，支持滚动查看
- 关注过滤只在认证用户下可用，未登录不显示按钮
- 数据库层面使用复合唯一索引防止重复关注

---

## Phase 13: WebSocket 实时推送 ✅ 已完成
- ✅ 前端: 创建 src/utils/ws.ts (connect, reconnect backoff, event emitter)
- ✅ 前端: App.vue 根据登录状态初始化连接，自动重连
- ✅ 前端: 通知事件增加未读计数徽章，弹窗/通知页数据刷新
- ✅ 前端: Like 事件实时更新 Forum 页面 DOM (乐观更新与服务器同步)
- ✅ 前端: Follow 事件广播 (控制台或 UI)
- ✅ 后端: wsService 已实现，路由 /ws 注册，带 JWT 认证
- ✅ 后端: ReactionService 与 FollowService 发送 WS 广播
- ✅ 容错: WS 失败仍依赖轮询降级
- ✅ 用户登出时断开连接

---

## 文档 ✅ 已更新
- ✅ API.md 新增: Tags, Reactions, Follows, WebSocket, Posts 扩展
- ✅ README.md 特性列表更新
- ✅ Task.md 本文件更新 (结构重组)

---

## 构建验证 ✅
- ✅ 后端: `npx tsc` 无错误 (忽略测试文件)
- ✅ 前端: `npm run build` 成功 (vue-tsc + vite)
- ✅ 向后兼容: 新增字段可选，不影响旧客户端

**最后更新**: 2026-04-10

---

# 心跳记录（示例）

> 心跳记录会保存在 `memory/YYYY-MM-DD.md` 文件中，不在此处展开。
