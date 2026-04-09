import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class TagService {
  async getAllTags() {
    return await prisma.tag.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        color: true,
      },
    })
  }

  async createTag(data: { name: string; color?: string }) {
    return await prisma.tag.create({
      data,
      select: {
        id: true,
        name: true,
        color: true,
      },
    })
  }

  async deleteTag(id: number) {
    return await prisma.tag.delete({
      where: { id },
    })
  }
}
