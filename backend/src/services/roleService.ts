import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class RoleService {
  async getAllRoles() {
    return await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
    })
  }

  async getRoleById(id: number) {
    return await prisma.role.findUnique({
      where: { id },
    })
  }

  async createRole(data: { name: string; description?: string }) {
    return await prisma.role.create({
      data,
    })
  }

  async updateRole(id: number, data: any) {
    return await prisma.role.update({
      where: { id },
      data,
    })
  }

  async deleteRole(id: number) {
    return await prisma.role.delete({
      where: { id },
    })
  }
}