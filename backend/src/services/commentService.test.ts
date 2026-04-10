import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Prisma for comment operations
const mockComment = {
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    get comment() { return mockComment }
    $disconnect = vi.fn()
  }
}))

import { CommentService } from '../services/commentService'

beforeEach(() => {
  mockComment.findMany.mockClear()
  mockComment.findUnique.mockClear()
  mockComment.create.mockClear()
  mockComment.update.mockClear()
  mockComment.delete.mockClear()
})

describe('CommentService', () => {
  const service = new CommentService()

  it('getCommentsByPostId 返回帖子顶级评论', async () => {
    mockComment.findMany.mockResolvedValue([
      {
        id: 1,
        content: '评论1',
        author: { id: 2, name: 'User2', nickname: 'U2', avatar: '', role: { id: 2, name: '用户' } },
        tags: [],
        replies: []
      }
    ])

    const result = await service.getCommentsByPostId(1)
    expect(result).toHaveLength(1)
    expect(mockComment.findMany).toHaveBeenCalledWith({
      where: { postId: 1, parentId: null },
      include: expect.objectContaining({
        author: expect.any(Object),
        tags: expect.anything(),
        replies: expect.objectContaining({
          include: expect.any(Object),
          orderBy: { createdAt: 'asc' }
        })
      }),
      orderBy: { createdAt: 'asc' }
    })
  })

  it('getCommentById 返回评论详情', async () => {
    mockComment.findUnique.mockResolvedValue({
      id: 1,
      content: '详情评论',
      author: { id: 2, name: 'U', nickname: 'n', avatar: '', role: { id: 2, name: '用户' } },
      post: { id: 1, content: '父帖' },
      tags: [{ id: 1, name: '标签' }]
    })

    const result = await service.getCommentById(1)
    expect(result?.id).toBe(1)
    expect(result?.post).toBeDefined()
    expect(result?.tags).toHaveLength(1)
  })

  it('createComment 创建评论', async () => {
    mockComment.create.mockResolvedValue({
      id: 2,
      content: '新评论',
      authorId: 2,
      postId: 1
    })
    mockComment.findUnique.mockResolvedValue({
      id: 2,
      content: '新评论',
      author: { id: 2, name: 'U', nickname: 'n', avatar: '', role: { id: 2, name: '用户' } },
      tags: []
    })

    const result = await service.createComment({
      content: '新评论',
      postId: 1,
      authorId: 2
    })

    expect(result?.content).toBe('新评论')
    expect(mockComment.create).toHaveBeenCalledWith({
      data: { content: '新评论', postId: 1, authorId: 2 },
      include: { author: { select: { avatar: true, id: true, name: true, nickname: true, role: true } } }
    })
  })

  it('createComment 带标签', async () => {
    mockComment.create.mockResolvedValue({ id: 3, content: '带标签', authorId: 2, postId: 1 })
    mockComment.update.mockResolvedValue({ id: 3 })
    mockComment.findUnique.mockResolvedValue({
      id: 3,
      content: '带标签',
      author: { id: 2, name: 'U', nickname: 'n', avatar: '', role: { id: 2, name: '用户' } },
      tags: [{ id: 5, name: '标签5' }]
    })

    const result = await service.createComment({
      content: '带标签',
      postId: 1,
      authorId: 2,
      tagIds: [5]
    })

    expect(mockComment.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { tags: { connect: [{ id: 5 }] } }
    })
    expect(result?.tags).toHaveLength(1)
  })

  it('updateComment 更新评论', async () => {
    mockComment.update.mockResolvedValue({
      id: 1,
      content: '已更新',
      author: { id: 2, name: 'U', nickname: 'n', avatar: '', role: { id: 2, name: '用户' } },
      tags: []
    })

    const result = await service.updateComment(1, '已更新')
    expect(result?.content).toBe('已更新')
    expect(mockComment.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { content: '已更新' },
      include: { author: { select: { avatar: true, id: true, name: true, nickname: true, role: true } }, tags: true }
    })
  })

  it('deleteComment 删除评论', async () => {
    mockComment.delete.mockResolvedValue({ id: 1, content: '删我' } as any)
    await service.deleteComment(1)
    expect(mockComment.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
