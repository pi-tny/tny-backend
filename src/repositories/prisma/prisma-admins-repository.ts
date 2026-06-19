import { prisma } from "@/lib/prisma";
import type { AdminsRepository } from "@/repositories/admins-repository";

export class PrismaAdminsRepository implements AdminsRepository {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  findById(id: number) {
    return prisma.admin.findUnique({ where: { id } });
  }
}
