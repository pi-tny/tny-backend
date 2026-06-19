import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import type {
  CreateLeadData,
  LeadsRepository,
  ListLeadsFilters,
} from "@/repositories/leads-repository";

export class PrismaLeadsRepository implements LeadsRepository {
  async upsertByEmail(data: CreateLeadData) {
    return prisma.lead.upsert({
      where: { email: data.email },
      create: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        marketing_consent: data.marketing_consent ?? true,
      },
      update: {
        name: data.name,
        phone: data.phone,
        marketing_consent: data.marketing_consent ?? true,
        consent_date: new Date(),
      },
    });
  }

  async list(filters: ListLeadsFilters) {
    const where: Prisma.LeadWhereInput = filters.q
      ? {
          OR: [
            { name: { contains: filters.q } },
            { email: { contains: filters.q } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, total, page: filters.page, limit: filters.limit };
  }

  async delete(id: number) {
    try {
      await prisma.lead.delete({ where: { id } });
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
