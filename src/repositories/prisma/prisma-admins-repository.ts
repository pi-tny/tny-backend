import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import type {
  AdminsRepository,
  CreateAdminData,
  UpdateAdminData,
} from "@/repositories/admins-repository";

export class PrismaAdminsRepository implements AdminsRepository {
  findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }

  findById(id: number) {
    return prisma.admin.findUnique({ where: { id } });
  }

  findMany() {
    return prisma.admin.findMany({ orderBy: { id: "asc" } });
  }

  create(data: CreateAdminData) {
    return prisma.admin.create({ data });
  }

  async update(id: number, data: UpdateAdminData) {
    try {
      return await prisma.admin.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      await prisma.admin.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }
}
