# API Documentation

**Base URL**: `https://api.oujun.work` (Production) | `http://localhost:8200` (Development)

**Authentication**: All endpoints except `/auth/login` require the header:
```
Authorization: Bearer <jwt-token>
```

**Response Format**: All endpoints return JSON with the following structure:

```json
{
  "success": true | false,
  "data": {}, // 成功时的数据
  "error": "error message" // 失败时的错误信息
}
```

---

## 🔐 Authentication

### POST `/auth/login`

**Description**: Authenticate with API key and receive JWT token

**Request Body**:
```json
{
  "apiKey": "your-api-key"
}
```

**Response**:
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

**cURL Example**:
```bash
curl -X POST https://api.oujun.work/auth/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your-api-key"}'
```

---

## 👥 Users

### GET `/users`

**Description**: Get all users with their roles (Requires authentication)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "apiKey": "xxx",
      "name": "Admin",
      "nickname": "Admin",
      "avatar": "",
      "createdAt": "2026-04-08T12:00:00.000Z",
      "updatedAt": "2026-04-08T12:00:00.000Z",
      "role": {
        "id": 1,
        "name": "admin",
        "description": "Administrator"
      }
    }
  ]
}
```

**cURL Example**:
```bash
curl https://api.oujun.work/users \
  -H "Authorization: Bearer <token>"
```

### GET `/users/:id`

**Description**: Get a specific user by ID

**Response**:
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

**cURL Example**:
```bash
curl https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>"
```

### POST `/users`

**Description**: Create a new user (Admin only recommended)

**Request Body**:
```json
{
  "apiKey": "new-user-key",
  "name": "John Doe",
  "nickname": "Johnny",
  "roleId": 2,
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response**: Created user object

**cURL Example**:
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

**Description**: Update a user (Admin only recommended)

**Request Body**: Partial user object
```json
{
  "name": "Updated Name",
  "nickname": "Updated Nick",
  "roleId": 2,
  "avatar": "https://..."
}
```

**cURL Example**:
```bash
curl -X PUT https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

### DELETE `/users/:id`

**Description**: Delete a user

**cURL Example**:
```bash
curl -X DELETE https://api.oujun.work/users/1 \
  -H "Authorization: Bearer <token>"
```

---

## 📝 Posts

### GET `/posts`

**Description**: Get all posts with author information and comment counts (Public)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Hello World!",
      "createdAt": "2026-04-08T12:00:00.000Z",
      "updatedAt": "2026-04-08T12:00:00.000Z",
      "author": {
        "id": 1,
        "apiKey": "xxx",
        "name": "Admin",
        "nickname": "Admin",
        "avatar": "",
        "role": { "id": 1, "name": "admin" }
      },
      "_count": {
        "comments": 5
      }
    }
  ]
}
```

**cURL Example**:
```bash
curl https://api.oujun.work/posts
```

### GET `/posts/:id`

**Description**: Get a single post with all its comments and nested replies

**Response**:
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

**cURL Example**:
```bash
curl https://api.oujun.work/posts/1
```

### POST `/posts`

**Description**: Create a new post (Authentication required)

**Request Body**:
```json
{
  "content": "This is my new post content"
}
```

**Response**: Created post with author info

**cURL Example**:
```bash
curl -X POST https://api.oujun.work/posts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"My post content"}'
```

### DELETE `/posts/:id`

**Description**: Delete a post (Only admin or post author)

**cURL Example**:
```bash
curl -X DELETE https://api.oujun.work/posts/1 \
  -H "Authorization: Bearer <token>"
```

---

## 💬 Comments

### GET `/posts/:postId/comments`

**Description**: Get all top-level comments for a post (with their replies)

**cURL Example**:
```bash
curl https://api.oujun.work/posts/1/comments
```

### POST `/posts/:postId/comments`

**Description**: Add a comment or reply (Authentication required)

**Request Body**:
```json
{
  "content": "This is a comment",
  "parentId": null // 或回复的评论ID
}
```

**cURL Example**:
```bash
curl -X POST https://api.oujun.work/posts/1/comments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Great post!"}'
```

### DELETE `/comments/:id`

**Description**: Delete a comment (Only admin or comment author)

**cURL Example**:
```bash
curl -X DELETE https://api.oujun.work/comments/5 \
  -H "Authorization: Bearer <token>"
```

---

## 🔧 Roles

### GET `/roles`

**Description**: Get all roles

**Response**:
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

**cURL Example**:
```bash
curl https://api.oujun.work/roles \
  -H "Authorization: Bearer <token>"
```

---

## 🏥 Health Check

### GET `/health`

**Description**: Health check endpoint (Public)

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-04-08T14:22:00.000Z"
}
```

**cURL Example**:
```bash
curl https://api.oujun.work/health
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