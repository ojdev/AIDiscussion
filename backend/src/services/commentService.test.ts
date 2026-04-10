import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock PrismaClient before importing services
vi.mock('@prisma/client', () => {
  const mockCommentFindMany = vi.fn()
  const mockCommentFindUnique = vi.fn()
  const mockCommentCreate = vi.fn()
  const mockCommentDelete = vi.fn()
  const mockCommentUpdate = vi.fn()
  const mockPostFindUnique = vi.fn()
  const mockTagFindMany = vi.fn()
  const mockTagFindUnique = vi.fn()
  const mockUserFindUnique = vi.fn()

  const mockComment = {
    findMany: mockCommentFindMany,
    findUnique: mockCommentFindUnique,
    create: mockCommentCreate,
    delete: mockCommentDelete,
    update: mockCommentUpdate
  }
  const mockPost = { findUnique: mockPostFindUnique }
  const mockTag = { findMany: mockTagFindMany, findUnique: mockTagFindUnique }
  const mockUser = { findUnique: mockUserFindUnique }

  // Expose mocks globally for test setup
  ;(global as any).__MOCK_PRISMA__ = {
    comment: mockComment,
    post: mockPost,
    tag: mockTag,
    user: mockUser
  }

  return {
    PrismaClient: class {
      comment = mockComment
      post = mockPost
      tag = mockTag
      user = mockUser
      $disconnect = vi.fn()
    }
  }
})

import { CommentService } from '../services/commentService.js'

beforeEach(() => {
  const mocks = (global as any).__MOCK_PRISMA__
  if (mocks) {
    vi.clearAllMocks()
    // Also clear individual mocks explicitly
    mocks.comment.findMany.mockClear?.()
    mocks.comment.findUnique.mockClear?.()
    mocks.comment.create.mockClear?.()
    mocks.comment.delete.mockClear?.()
    mocks.comment.update.mockClear?.()
    mocks.post.findUnique.mockClear?.()
    mocks.tag.findMany.mockClear?.()
    mocks.tag.findUnique.mockClear?.()
    mocks.user.findUnique.mockClear?.()
  }
})

describe('CommentService', () => {
  const service = new CommentService()
  const mocks = (global as any).__MOCK_PRISMA__

  describe('getCommentsByPostId', () => {
    it('应返回帖子的顶级评论及其回复', async () => {
      const mockComments = [
        {
          id: 1,
          content: 'Top comment',
          author: { id: 1, name: 'User1', nickname: 'U1', avatar: '', role: { name: 'user' } },
          tags: [],
          replies: [{
            id: 2,
            content: 'Reply',
            author: { id: 2, name: 'User2', nickname: 'U2', avatar: '', role: { name: 'admin' } },
            tags: []
          }]
        }
      ]

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.findMany.mockResolvedValue(mockComments)

      const result = await service.getCommentsByPostId(1)

      expect(result).toHaveLength(1)
      expect(result[0].replies).toHaveLength(1)
      expect(client.comment.findMany).toHaveBeenCalledWith({
        where: { postId: 1, parentId: null },
        include: expect.objectContaining({
          author: expect.any(Object),
          tags: true,
          replies: expect.objectContaining({
            include: expect.any(Object),
            orderBy: { createdAt: 'asc' }
          })
        }),
        orderBy: { createdAt: 'asc' }
      })
    })

    it('无评论时返回空数组', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.findMany.mockResolvedValue([])

      const result = await service.getCommentsByPostId(999)

      expect(result).toEqual([])
    })
  })

  describe('createComment', () => {
    it('应创建顶级评论', async () => {
      const mockComment = {
        id: 1,
        content: 'New comment',
        postId: 1,
        authorId: 1,
        parentId: null,
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.create.mockResolvedValueOnce(mockComment)

      const result = await service.createComment({
        content: 'New comment',
        postId: 1,
        authorId: 1
      })

      expect(result).toEqual(mockComment)
      expect(client.comment.create).toHaveBeenCalledWith({
        data: { content: 'New comment', postId: 1, authorId: 1 },
        include: { author: expect.any(Object) }
      })
    })

    it('应创建回复', async () => {
      const mockComment = {
        id: 2,
        content: 'Reply',
        postId: 1,
        authorId: 1,
        parentId: 1
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.create.mockResolvedValueOnce(mockComment)

      const result = await service.createComment({
        content: 'Reply',
        postId: 1,
        authorId: 1,
        parentId: 1
      })

      expect(result.parentId).toBe(1)
    })

    it('应创建评论并关联标签', async () => {
      const createdComment = { id: 1, content: 'Comment', postId: 1, authorId: 1 }
      const commentWithTags = {
        id: 1,
        content: 'Comment',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: [{ id: 1, name: 'Tag1', color: '#000' }]
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.create.mockResolvedValueOnce(createdComment)
      client.comment.update.mockResolvedValueOnce()
      client.comment.findUnique.mockResolvedValueOnce(commentWithTags)

      const result = await service.createComment({
        content: 'Comment',
        postId: 1,
        authorId: 1,
        tagIds: [1]
      })

      expect(result).toEqual(commentWithTags)
      expect(client.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tags: { connect: [{ id: 1 }] } }
      })
    })
  })

  describe('deleteComment', () => {
    it('应删除评论', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.delete.mockResolvedValue({ id: 1 })

      await service.deleteComment(1)

      expect(client.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('getCommentById', () => {
    it('应返回评论详情', async () => {
      const mockComment = {
        id: 1,
        content: 'Comment',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        post: { id: 1 },
        tags: []
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.findUnique.mockResolvedValue(mockComment)

      const result = await service.getCommentById(1)

      expect(result).toEqual(mockComment)
      expect(client.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          author: expect.any(Object),
          post: true,
          tags: true
        })
      })
    })

    it('未找到评论返回null', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.findUnique.mockResolvedValue(null)

      const result = await service.getCommentById(999)

      expect(result).toBeNull()
    })
  })

  describe('updateComment', () => {
    it('应更新评论内容', async () => {
      const updatedComment = {
        id: 1,
        content: 'Updated content',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: []
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.comment.update.mockResolvedValue(updatedComment)

      const result = await service.updateComment(1, 'Updated content')

      expect(result.content).toBe('Updated content')
      expect(client.comment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: 'Updated content' },
        include: expect.objectContaining({
          author: expect.any(Object),
          tags: true
        })
      })
    })
  })
})
