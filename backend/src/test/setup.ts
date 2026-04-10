import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

// 强制使用 SQLite 测试数据库
process.env.DATABASE_URL = 'file:./test.db'

const prisma = new PrismaClient()

beforeAll(async () => {
  // 迁移数据库（创建表）
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`
  await prisma.$transaction([
    prisma.$executeRaw`DROP TABLE IF EXISTS _prisma_migrations`,
    prisma.$executeRaw`DROP TABLE IF EXISTS CommentTags`,
    prisma.$executeRaw`DROP TABLE IF EXISTS PostTags`,
    prisma.$executeRaw`DROP TABLE IF EXISTS Comment`,
    prisma.$executeRaw`DROP TABLE IF EXISTS Post`,
    prisma.$executeRaw`DROP TABLE IF EXISTS Tag`,
    prisma.$executeRaw`DROP TABLE IF EXISTS User`,
    prisma.$executeRaw`DROP TABLE IF EXISTS Role`
  ])
  // 创建表结构（使用 Prisma schema 的 SQL）
  await prisma.$executeRaw`
    CREATE TABLE "Role" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "description" TEXT
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "User" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "apiKey" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "nickname" TEXT,
      "avatar" TEXT,
      "roleId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "Post" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "content" TEXT NOT NULL,
      "authorId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "Comment" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "content" TEXT NOT NULL,
      "authorId" INTEGER NOT NULL,
      "postId" INTEGER NOT NULL,
      "parentId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "Tag" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "color" TEXT DEFAULT '#808080'
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "PostTags" (
      "A" INTEGER NOT NULL,
      "B" INTEGER NOT NULL,
      FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `
  await prisma.$executeRaw`
    CREATE TABLE "CommentTags" (
      "A" INTEGER NOT NULL,
      "B" INTEGER NOT NULL,
      FOREIGN KEY ("A") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX "PostTags_AB_unique" ON "PostTags"("A", "B")
  `
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX "CommentTags_AB_unique" ON "CommentTags"("A", "B")
  `
  await prisma.$executeRaw`
    CREATE INDEX "Post_authorId_idx" ON "Post"("authorId")
  `
  await prisma.$executeRaw`
    CREATE INDEX "Comment_postId_idx" ON "Comment"("postId")
  `
  await prisma.$executeRaw`
    CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId")
  `
  await prisma.$executeRaw`
    CREATE INDEX "User_roleId_idx" ON "User"("roleId")
  `
  // 初始化角色
  await prisma.role.createMany({
    data: [
      { id: 1, name: '管理员', description: '系统管理员' },
      { id: 2, name: '用户', description: '普通用户' }
    ]
  })
  // 初始化测试用户
  const admin = await prisma.user.create({
    data: {
      apiKey: 'test-admin-key',
      password: 'hashedpassword',
      name: 'Admin',
      nickname: '管理员',
      roleId: 1
    },
    select: { id: true }
  })
  const user = await prisma.user.create({
    data: {
      apiKey: 'test-user-key',
      password: 'hashedpassword',
      name: 'User',
      nickname: '普通用户',
      roleId: 2
    },
    select: { id: true }
  })
  // 暴露到全局供测试使用
  ;(global as any).TEST_ADMIN_ID = admin.id
  ;(global as any).TEST_USER_ID = user.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

export { prisma }
