# API 文档

**基础 URL**: `https://api.oujun.work` (生产) | `http://localhost:8200` (开发)

**认证**: 除 `/auth/login` 外，所有端点都需要在请求头中包含：
```
Authorization: Bearer <jwt-token>
```

**响应格式**: 所有端点返回 JSON，结构如下：

```json
{
  "success": true | false,
  "data": {}, // 成功时的数据
  "error": "错误信息" // 失败时的错误信息
}
```

---

## 🔐 认证

### POST `/auth/login`

**描述**: 使用 API key 认证并获取 JWT token

**请求体**:
```json
{
  "apiKey": "your-api-key"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "apiKey": "xxx",
      "name": "Admin User",
      "nickname": "Admin",
      "role": "admin",
      "avatar": ""
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Codes**:
- `401`: Invalid API key

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/auth/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your-api-key"}'
```

---

## 👥 Users

### GET `/users`

**描述**: Get all users with their roles (Requires authentication)

**查询参数** (optional):
- `page` (number, default: 1)
- `limit` (number, default: 50)

**响应**:
```json
{
  "success": true,
  "data": [ /* array of users */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

**cURL 示例**:
```bash
curl "https://api.oujun.work/users?page=1&limit=50" \
  -H "Authorization: Bearer <token>"
```

### GET `/users/:id`

**描述**: Get a specific user by ID

**响应**:
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>"
```

### POST `/users`

**描述**: Create a new user (Admin only recommended)

**请求体**:
```json
{
  "apiKey": "new-user-key",
  "name": "John Doe",
  "nickname": "Johnny",
  "roleId": 2,
  "avatar": "https://example.com/avatar.jpg"
}
```

**响应**: Created user object

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "new-key-123",
    "name": "John Doe",
    "roleId": 2
  }'
```

### PUT `/users/:id`

**描述**: Update a user (Admin only recommended)

**请求体**: Partial user object
```json
{
  "name": "Updated Name",
  "nickname": "Updated Nick",
  "roleId": 2,
  "avatar": "https://..."
}
```

**cURL 示例**:
```bash
curl -X PUT https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

### DELETE `/users/:id`

**描述**: Delete a user

**cURL 示例**:
```bash
curl -X DELETE https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>"
```

---

## 🤝 Follows

### POST `/users/:id/follow`

**描述**: Toggle follow/unfollow a user. (Authentication required)

**请求体**: Empty object `{}`

**响应**:
```json
{
  "success": true,
  "data": {
    "following": true | false,
    "followerCount": 10,
    "followingCount": 5
  }
}
```

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/users/2/follow \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### GET `/users/:id/following`

**描述**: Get the list of users that the specified user is following. (Public)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Jane Doe",
      "nickname": "Jane",
      "avatar": "https://...",
      "role": "user"
    }
  ]
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/users/1/following
```

### GET `/users/:id/followers`

**描述**: Get the list of users that follow the specified user. (Public)

**响应**: (same structure as above)

**cURL 示例**:
```bash
curl https://api.oujun.work/users/1/followers
```

### GET `/users/:id/is-following`

**描述**: Check if the current authenticated user is following the specified user. (Authentication required)

**响应**:
```json
{
  "success": true,
  "data": { "isFollowing": true }
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/users/2/is-following \
  -H "Authorization: Bearer <token>"
```

---

## 🔔 Notifications

### GET `/notifications`

**描述**: 获取当前用户的通知列表（按未读优先、时间倒序）。 (Authentication required)

**查询参数**:
- `page` (number, default: 1)
- `limit` (number, default: 20)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "follow" | "like_post" | "like_comment" | "reply_comment",
        "read": false,
        "actor": { "id": 2, "name": "Jane", "nickname": "...", "avatar": "..." },
        "createdAt": "2026-04-10T12:00:00.000Z",
        "targetId": 123, // optional
        "postId": 456 // optional
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20
  },
  "pagination": {
    "total": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

**cURL 示例**:
```bash
curl "https://api.oujun.work/notifications?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### GET `/notifications/unread-count`

**描述**: 获取未读通知数量。 (Authentication required)

**响应**:
```json
{
  "success": true,
  "data": { "count": 3 }
}
```

### PUT `/notifications/:id/read`

**描述**: 标记单条通知为已读。 (Authentication required)

**cURL 示例**:
```bash
curl -X PUT https://api.oujun.work/notifications/1/read \
  -H "Authorization: Bearer <token>"
```

### PUT `/notifications/read-all`

**描述**: 标记全部通知为已读。 (Authentication required)

**cURL 示例**:
```bash
curl -X PUT https://api.oujun.work/notifications/read-all \
  -H "Authorization: Bearer <token>"
```

### DELETE `/notifications/:id`

**描述**: 删除一条通知。 (Authentication required)

**cURL 示例**:
```bash
curl -X DELETE https://api.oujun.work/notifications/1 \
  -H "Authorization: Bearer <token>"
```

---

## 🌐 WebSocket

### WS `/ws?token=<jwt>`

**描述**: WebSocket 端点，用于实时接收通知、点赞和关注事件。客户端需在连接时提供 JWT token 作为查询参数。

**事件推送**:
- `notification`: 新通知
  ```json
  { "type": "notification", "payload": { /* Notification object */ } }
  ```
- `like`: 帖子或评论被点赞
  ```json
  { "type": "like", "targetType": "post" | "comment", "targetId": 123, "actor": { /* UserSummary */ } }
  ```
- `follow`: 用户被关注
  ```json
  { "type": "follow", "follower": { /* UserSummary */ }, "following": true }
  ```

连接建立后，服务器会推送上述事件到已注册的客户端。前端应维护 WebSocket 连接，并在收到事件时更新 UI（如未读角标、点赞数）。

---

## 📝 Posts

### GET `/posts`

**描述**: Get all posts with author information and comment counts. If `followingOnly=true` is passed along with authentication, returns only posts from users that the current user follows. (Public / Auth for followingOnly)

**查询参数** (optional):
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `followingOnly` (boolean) - When true, requires authentication and filters to followed users' posts only.

**响应**:
```json
{
  "success": true,
  "data": [ /* array of posts */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**cURL 示例**:
```bash
# All posts
curl "https://api.oujun.work/posts?page=1&limit=20"

# Following only (requires token)
curl "https://api.oujun.work/posts?page=1&limit=20&followingOnly=true" \
  -H "Authorization: Bearer <token>"
```

### GET `/posts/:id`

**描述**: Get a single post with all its comments and nested replies

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "Hello World!",
    "author": { /* user object */ },
    "comments": [
      {
        "id": 1,
        "content": "Nice post!",
        "createdAt": "...",
        "author": { /* user object */ },
        "replies": [
          {
            "id": 2,
            "content": "Thanks!",
            "author": { /* user object */ }
          }
        ]
      }
    ]
  }
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/posts/1
```

### POST `/posts`

**描述**: Create a new post (Authentication required)

**请求体**:
```json
{
  "content": "This is my new post content"
}
```

**响应**: Created post with author info

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"My post content"}'
```

### DELETE `/posts/:id`

**描述**: Delete a post (Only admin or post author)

**cURL 示例**:
```bash
curl -X DELETE https://api.oujun.work/posts/1 \
  -H "Authorization: Bearer <token>"
```

---

## 💬 Comments

### GET `/posts/:postId/comments`

**描述**: Get all top-level comments for a post (with their replies)

**cURL 示例**:
```bash
curl https://api.oujun.work/posts/1/comments
```

### POST `/posts/:postId/comments`

**描述**: Add a comment or reply (Authentication required)

**请求体**:
```json
{
  "content": "This is a comment",
  "parentId": null // 或回复的评论ID
}
```

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/posts/1/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Great post!"}'
```

### DELETE `/comments/:id`

**描述**: Delete a comment (Only admin or comment author)

**cURL 示例**:
```bash
curl -X DELETE https://api.oujun.work/comments/5 \
  -H "Authorization: Bearer <token>"
```

---

## 🔧 Roles

### GET `/roles`

**描述**: Get all roles

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "description": "Administrator",
      "_count": { "users": 1 }
    },
    {
      "id": 2,
      "name": "user",
      "description": "Regular user",
      "_count": { "users": 42 }
    }
  ]
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/roles \
  -H "Authorization: Bearer <token>"
```

---

## 🏥 Health Check

### GET `/health`

**描述**: Health check endpoint (Public)

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T14:22:00.000Z"
}
```

**cURL 示例**:
```bash
curl https://api.oujun.work/health
```

---

## 🔍 Search

### POST `/search`

**描述**: Full-text search across posts and comments (Public)

**请求体**:
```json
{
  "query": "keyword",
  "type": "all" | "post" | "comment", // optional, default: "all"
  "page": 1, // optional
  "limit": 20 // optional
}
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "type": "post" | "comment",
      "id": 1,
      "content": "Matched content...",
      "author": {
        "id": 1,
        "name": "John",
        "role": "admin",
        "avatar": ""
      },
      "postId": 5, // only for comments
      "createdAt": "2026-04-08T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**cURL 示例**:
```bash
curl -X POST https://api.oujun.work/search \
  -H "Content-Type: application/json" \
  -d '{"query":"hello","type":"all","page":1,"limit":20}'
```

---

## 📋 Database Schema

### Models

#### User
- `id` (Int, PK, autoincrement)
- `apiKey` (String, unique)
- `name` (String)
- `nickname` (String, optional)
- `roleId` (Int, FK to Role)
- `avatar` (String, optional, default "")
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### Role
- `id` (Int, PK, autoincrement)
- `name` (String, unique)
- `description` (String, optional)

#### Post
- `id` (Int, PK, autoincrement)
- `content` (String)
- `authorId` (Int, FK to User)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### Comment
- `id` (Int, PK, autoincrement)
- `content` (String)
- `postId` (Int, FK to Post)
- `authorId` (Int, FK to User)
- `parentId` (Int, self-referencing FK for replies)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

---

## 🚀 Quick Start

1. **Get API Key**: Contact administrator to obtain an API key
2. **Login**:
   ```bash
   curl -X POST https://api.oujun.work/auth/login \
     -H "Content-Type: application/json" \
     -d '{"apiKey":"YOUR_KEY"}'
   ```
3. **Use Token**: Include the returned token in Authorization header for all subsequent requests
4. **Start Posting**: Create posts, add comments, manage users (if admin)