import { PrismaClient } from '@prisma/client'
import { wsService } from './wsService.js'
import { NotificationService } from './notificationService.js'

const prisma = new PrismaClient()

export interface FollowResponse {
  following: boolean
  followerCount: number
  followingCount: number
}

export interface UserSummary {
  id: number
  name: string
  nickname?: string
  avatar?: string
  role: string
}


export class FollowService {
  async toggleFollow(currentUserId: number, targetUserId: number): Promise<FollowResponse> {
    if (currentUserId === targetUserId) {
      throw new Error('Cannot follow yourself')
    }

    // Ensure target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })
    if (!targetUser) {
      throw new Error('User not found')
    }

    // Check existing follow
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    if (existingFollow) {
      // Unfollow: delete by composite key
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      })
    }

    // Get counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } })
    ])

    // Get actor info
    const actor = await prisma.user.findFirst({
      where: { id: currentUserId },
      select: { id: true, name: true, nickname: true, avatar: true, role: { select: { name: true } } }
    })

    const notificationService = new NotificationService()

    // Broadcast follow event to target user
    if (actor) {
      wsService.broadcastToUser(targetUserId, {
        type: 'follow',
        follower: {
          id: actor.id,
          name: actor.name,
          nickname: actor.nickname,
          avatar: actor.avatar,
          role: actor.role.name
        },
        following: !existingFollow
      })

      // Create a persistent notification for the new follow
      if (!existingFollow) {
        // Create follow notification for target user
        await notificationService.createNotification({
          receiverId: targetUserId,
          type: 'follow',
          actorId: currentUserId
        })
      }
    }

    return {
      following: !existingFollow,
      followerCount,
      followingCount
    }
  }

  async getFollowing(userId: number): Promise<UserSummary[]> {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return follows.map(f => ({
      id: f.following.id,
      name: f.following.name,
      nickname: f.following.nickname,
      avatar: f.following.avatar,
      role: f.following.role.name
    }))
  }

  async getFollowers(userId: number): Promise<UserSummary[]> {
    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return follows.map(f => ({
      id: f.follower.id,
      name: f.follower.name,
      nickname: f.follower.nickname,
      avatar: f.follower.avatar,
      role: f.follower.role.name
    }))
  }

  async checkIsFollowing(currentUserId: number, targetUserId: number): Promise<boolean> {
    if (currentUserId === targetUserId) return false

    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    })

    return !!existingFollow
  }
}
