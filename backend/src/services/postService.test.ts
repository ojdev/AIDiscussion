import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock PrismaClient before importing services
vi.mock('@prisma/client', () => {
  const mockPostFindMany = vi.fn()
  const mockPostFindUnique = vi.fn()
  const mockPostCreate = vi.fn()
  const mockPostDelete = vi.fn()
  const mockPostUpdate = vi.fn()
  const mockPostCount = vi.fn()

  const mockComment = {
    findMany: vi.fn(),
    count: vi.fn()
  }

  const mockTag = {
    findMany: vi.fn(),
    findUnique: vi.fn()
  }

  return {
    PrismaClient: class {
      post = {
        findMany: mockPostFindMany,
        findUnique: mockPostFindUnique,
        create: mockPostCreate,
        delete: mockPostDelete,
        update: mockPostUpdate,
        count: mockPostCount
      }
      comment = mockComment
      tag = mockTag
      $disconnect = vi.fn()
    }
  }
})

import { PostService } from '../services/postService.js'

beforeEach(() => {
  // Clear all mocks
  const { PrismaClient } = require('@prisma/client')
  const client = new PrismaClient()
  vi.clearAllMocks()
})

describe('PostService', () => {
  const service = new PostService()

  describe('getAllPosts', () => {
    it('应返回分页的帖子列表', async () => {
      const mockPosts = [
        {
          id: 1,
          content: 'Post 1',
          author: { id: 1, name: 'User1', nickname: 'U1', avatar: '', role: { name: 'user' } },
          _count: { comments: 5 }
        },
        {
          id: 2,
          content: 'Post 2',
          author: { id: 2, name: 'User2', nickname: 'U2', avatar: '', role: { name: 'admin' } },
          _count: { comments: 10 }
        }
      ]

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.count.mockResolvedValue(25)
      client.post.findMany.mockResolvedValue(mockPosts)

      const result = await service.getAllPosts(1, 2)

      expect(result.data).toHaveLength(2)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 25,
        totalPages: 13
      })
      expect(client.post.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          author: expect.any(Object),
          _count: expect.objectContaining({ select: { comments: true } })
        }),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 2
      })
    })

    it('应正确处理无数据情况', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.count.mockResolvedValue(0)
      client.post.findMany.mockResolvedValue([])

      const result = await service.getAllPosts(1, 20)

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(0)
    })
  })

  describe('getPostById', () => {
    it('应返回帖子及其评论和标签', async () => {
      const mockPost = {
        id: 1,
        content: 'Test post',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: [{ id: 1, name: 'Tech', color: '#000' }],
        comments: [{
          id: 1,
          content: 'Comment',
          author: { id: 2, name: 'ReplyUser', nickname: 'R', avatar: '', role: { name: 'user' } },
          replies: []
        }]
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.findUnique.mockResolvedValue(mockPost)

      const result = await service.getPostById(1)

      expect(result).toEqual(mockPost)
      expect(client.post.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.objectContaining({
          author: expect.any(Object),
          tags: true,
          comments: expect.objectContaining({
            include: expect.any(Object),
            orderBy: { createdAt: 'asc' }
          })
        })
      })
    })

    it('未找到帖子时返回null', async () => {
      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.findUnique.mockResolvedValue(null)

      const result = await service.getPostById(999)

      expect(result).toBeNull()
    })
  })

  describe('createPost', () => {
    it('应创建帖子（不含标签）', async () => {
      const mockPost = {
        id: 1,
        content: 'New post',
        authorId: 1,
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } }
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.create.mockResolvedValueOnce(mockPost)
      client.post.findUnique.mockResolvedValue(mockPost)

      const result = await service.createPost({ content: 'New post', authorId: 1 })

      expect(result).toEqual(mockPost)
      expect(client.post.create).toHaveBeenCalledWith({
        data: { content: 'New post', authorId: 1 },
        include: { author: expect.any(Object) }
      })
    })

    it('应创建帖子并关联标签', async () => {
      const createdPost = { id: 1, content: 'Post', authorId: 1 }
      const postWithTags = {
        id: 1,
        content: 'Post',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: [{ id: 1, name: 'Tag1', color: '#000' }]
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.create.mockResolvedValueOnce(createdPost)
      client.post.update.mockResolvedValueOnce()
      client.post.findUnique.mockResolvedValueOnce(postWithTags)

      const result = await service.createPost({ content: 'Post', authorId: 1, tagIds: [1] })

      expect(result).toEqual(postWithTags)
      expect(client.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tags: { connect: [{ id: 1 }] } }
      })
    })
  })

  describe('deletePost', () => {
    it('应删除帖子', async () => {
      const deletedPost = { id: 1, content: 'Deleted', authorId: 1 }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.delete.mockResolvedValue(deletedPost)

      await service.deletePost(1)

      expect(client.post.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('updatePost', () => {
    it('应更新帖子内容', async () => {
      const updatedPost = {
        id: 1,
        content: 'Updated content',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: []
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.findUnique.mockResolvedValueOnce(updatedPost)
      // The service calls findUnique after update
      client.post.findUnique.mockResolvedValueOnce(updatedPost)

      const result = await service.updatePost(1, 'Updated content')

      expect(result.content).toBe('Updated content')
      expect(client.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: 'Updated content' }
      })
    })

    it('应更新帖子标签', async () => {
      const updatedPost = {
        id: 1,
        content: 'Content',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        tags: [{ id: 2, name: 'Tag2', color: '#333' }]
      }

      const { PrismaClient } = require('@prisma/client')
      const client = new PrismaClient()
      client.post.findUnique.mockResolvedValueOnce({}) // get post before update
      client.post.update.mockResolvedValueOnce() // clear tags
      client.post.update.mockResolvedValueOnce() // set new tags
      client.post.findUnique.mockResolvedValueOnce(updatedPost)

      const result = await service.updatePost(1, 'Content', [2])

      expect(result).toEqual(updatedPost)
    })
  })
})
