import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import type {
  CategoriesRepository,
  CategoryInput,
  ListCategoriesParams,
} from "@/repositories/categories-repository";

export class PrismaCategoriesRepository implements CategoriesRepository {
  async findMany({ page, limit }: ListCategoriesParams) {
    const [items, total] = await Promise.all([
      prisma.category.findMany({
        orderBy: { id: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.category.count(),
    ]);

    return { items, total, page, limit };
  }

  findById(id: number) {
    return prisma.category.findUnique({ where: { id } });
  }

  create(data: CategoryInput) {
    return prisma.category.create({ data });
  }

  async update(id: number, data: CategoryInput) {
    try {
      return await prisma.category.update({ where: { id }, data });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025" // record to update not found
      ) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      await prisma.category.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025" // record to delete not found
      ) {
        return false;
      }
      throw error;
    }
  }
}
