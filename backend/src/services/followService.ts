import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class FollowService {
  constructor(private notificationService?: any) {}

  /**
   * Toggle follow/unfollow a user
   * @param followerId - current user ID
   * @param followingId - target user ID to follow/unfollow
   * @returns { following: boolean, followerCount: number, followingCount: number }
   */
  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if already following
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    })

    let following = false
    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId, followingId } },
      })
      following = false
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      })
      following = true

      // 发送关注通知（被关注者收到）
      if (this.notificationService) {
        await this.notificationService.createNotification(
          followingId,
          followerId,
          'follow'
        )
      }
    }

    // Get counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({
        where: { followingId },
      }),
      prisma.follow.count({
        where: { followerId },
      }),
    ])

    return { following, followerCount, followingCount }
  }

  /**
   * Get list of users that a user is following
   * @param userId - user ID
   */
  async getFollowing(userId: number) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return follows.map((f) => f.following)
  }

  /**
   * Get list of followers for a user
   * @param userId - user ID
   */
  async getFollowers(userId: number) {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return follows.map((f) => f.follower)
  }

  /**
   * Check if current user is following another user
   * @param userId - current user ID
   * @param targetUserId - target user ID
   */
  async checkIsFollowing(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      return { isFollowing: false }
    }
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    })
    return { isFollowing: !!existing }
  }
}
