import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock PrismaClient before importing services
vi.mock('@prisma/client', () => {
  const mockPostFindMany = vi.fn()
  const mockPostFindUnique = vi.fn()
  const mockPostCreate = vi.fn()
  const mockPostDelete = vi.fn()
  const mockPostUpdate = vi.fn()
  const mockPostCount = vi.fn()
  const mockCommentFindMany = vi.fn()
  const mockCommentCount = vi.fn()
  const mockTagFindMany = vi.fn()
  const mockTagFindUnique = vi.fn()
  const mockFollowFindMany = vi.fn()
  const mockReactionCount = vi.fn()

  const mocks = {
    post: {
      findMany: mockPostFindMany,
      findUnique: mockPostFindUnique,
      create: mockPostCreate,
      delete: mockPostDelete,
      update: mockPostUpdate,
      count: mockPostCount
    },
    comment: {
      findMany: mockCommentFindMany,
      count: mockCommentCount
    },
    tag: {
      findMany: mockTagFindMany,
      findUnique: mockTagFindUnique
    },
    follow: {
      findMany: mockFollowFindMany
    },
    reaction: {
      count: mockReactionCount
    }
  }

  ;(global as any).__MOCK_PRISMA__ = mocks

  return {
    PrismaClient: class {
      post = mocks.post
      comment = mocks.comment
      tag = mocks.tag
      follow = mocks.follow
      reaction = mocks.reaction
      $disconnect = vi.fn()
    }
  }
})

import { PostService } from '../services/postService.js'

beforeEach(() => {
  const mocks = (global as any).__MOCK_PRISMA__
  if (mocks) {
    vi.clearAllMocks()
    // Default counts return 0
    mocks.reaction.count.mockResolvedValue(0)
    mocks.comment.count.mockResolvedValue(0)
  }
})

describe('PostService', () => {
  const service = new PostService()
  const mocks = (global as any).__MOCK_PRISMA__

  describe('getAllPosts', () => {
    it('应返回分页的帖子列表', async () => {
      const mockPosts = [
        {
          id: 1,
          content: 'Post 1',
          author: { id: 1, name: 'User1', nickname: 'U1', avatar: '', role: { name: 'user' } },
          _count: { comments: 5 },
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorId: 1
        },
        {
          id: 2,
          content: 'Post 2',
          author: { id: 2, name: 'User2', nickname: 'U2', avatar: '', role: { name: 'user' } },
          _count: { comments: 3 },
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorId: 2
        }
      ]

      mocks.post.count.mockResolvedValue(25)
      mocks.post.findMany.mockResolvedValue(mockPosts)

      const result = await service.getAllPosts(1, 20)

      expect(result.data).toHaveLength(2)
      // likeCount should be added (0 from default mock)
      expect(result.data[0]).toHaveProperty('likeCount')
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2
      })
      expect(mocks.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20
        })
      )
    })

    it('应正确处理无数据情况', async () => {
      mocks.post.count.mockResolvedValue(0)
      mocks.post.findMany.mockResolvedValue([])

      const result = await service.getAllPosts(1, 20)

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })

    it('应支持按标签筛选', async () => {
      mocks.post.count.mockResolvedValue(5)
      mocks.post.findMany.mockResolvedValue([])

      await service.getAllPosts(1, 20, 1)

      expect(mocks.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { id: 1 } }
          })
        })
      )
    })

    it('应支持只看关注 (followingOnly)', async () => {
      mocks.follow.findMany.mockResolvedValue([
        { followingId: 1 },
        { followingId: 2 }
      ])
      mocks.post.count.mockResolvedValue(10)
      mocks.post.findMany.mockResolvedValue([])

      await service.getAllPosts(1, 20, undefined, 123, true)

      expect(mocks.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: 123 },
        select: { followingId: true }
      })
      expect(mocks.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: { in: [1, 2] }
          })
        })
      )
    })

    it('关注列表为空时返回空数组', async () => {
      mocks.follow.findMany.mockResolvedValue([])

      const result = await service.getAllPosts(1, 20, undefined, 123, true)

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('getPostById', () => {
    it('应返回帖子及其评论和标签', async () => {
      const mockPost = {
        id: 1,
        content: 'Post content',
        author: { id: 1, name: 'User', nickname: 'U', avatar: '', role: { name: 'user' } },
        _count: { comments: 2 },
        tags: [{ id: 1, name: 'Tag1' }],
        comments: [
          {
            id: 1,
            content: 'Comment 1',
            author: { id: 2, name: 'User2', role: { name: 'user' } },
            tags: [],
            replies: []
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 1
      }

      mocks.post.findUnique.mockResolvedValue(mockPost)

      const result = await service.getPostById(1)

      expect(result).toBeDefined()
      expect(result!.id).toBe(1)
      expect(result!.likeCount).toBe(0) // from reaction mock
      expect(result!.comments).toHaveLength(1)
      expect(mocks.post.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 }
        })
      )
    })

    it('未找到帖子时返回null', async () => {
      mocks.post.findUnique.mockResolvedValue(null)

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
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mocks.post.create.mockResolvedValueOnce(mockPost)
      mocks.post.findUnique.mockResolvedValueOnce(mockPost)

      const result = await service.createPost({ content: 'New post', authorId: 1 })

      expect(result).toEqual(mockPost)
      expect(mocks.post.create).toHaveBeenCalledWith({
        data: { content: 'New post', authorId: 1 }
      })
    })

    it('应创建帖子并关联标签', async () => {
      const createdPost = { id: 1, content: 'Post with tags', authorId: 1 }
      const postWithTags = {
        id: 1,
        content: 'Post with tags',
        authorId: 1,
        tags: [{ id: 1, name: 'Tag1' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mocks.post.create.mockResolvedValueOnce(createdPost)
      mocks.post.update.mockResolvedValueOnce()
      mocks.post.findUnique.mockResolvedValueOnce(postWithTags)

      const result = await service.createPost({
        content: 'Post with tags',
        authorId: 1,
        tagIds: [1]
      })

      expect(result.tags).toHaveLength(1)
      expect(mocks.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tags: { connect: [{ id: 1 }] } }
      })
    })
  })

  describe('deletePost', () => {
    it('应删除帖子', async () => {
      const deletedPost = { id: 1, content: 'Deleted' }
      mocks.post.delete.mockResolvedValue(deletedPost)

      await service.deletePost(1)

      expect(mocks.post.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })
  })

  describe('updatePost', () => {
    it('应更新帖子内容', async () => {
      const updatedPost = {
        id: 1,
        content: 'Updated content',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 1
      }

      // For update, we need to handle the update then findUnique
      mocks.post.update.mockResolvedValueOnce(updatedPost)
      mocks.post.findUnique.mockResolvedValueOnce(updatedPost)

      const result = await service.updatePost(1, { content: 'Updated content' })

      expect(result!.content).toBe('Updated content')
      expect(mocks.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { content: 'Updated content' }
      })
    })

    it('应更新帖子标签（清空）', async () => {
      const updatedPost = {
        id: 1,
        content: 'Post',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 1
      }

      mocks.post.update.mockResolvedValueOnce(updatedPost)
      mocks.post.findUnique.mockResolvedValueOnce(updatedPost)

      const result = await service.updatePost(1, { tagIds: [] })

      expect(result!.tags).toHaveLength(0)
      expect(mocks.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tags: { set: [] } }
      })
    })

    it('应更新帖子标签（设置新标签）', async () => {
      const updatedPost = {
        id: 1,
        content: 'Post',
        tags: [{ id: 1, name: 'Tag1' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: 1
      }

      mocks.post.update.mockResolvedValueOnce(updatedPost)
      mocks.post.findUnique.mockResolvedValueOnce(updatedPost)

      const result = await service.updatePost(1, { tagIds: [1] })

      expect(result!.tags).toHaveLength(1)
      expect(mocks.post.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { tags: { set: [{ id: 1 }] } }
      })
    })
  })
})
