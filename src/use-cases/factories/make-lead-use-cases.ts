import { PrismaLeadsRepository } from "@/repositories/prisma/prisma-leads-repository";
import { CreateLeadUseCase } from "@/use-cases/leads/create-lead";
import { ListLeadsUseCase } from "@/use-cases/leads/list-leads";
import { DeleteLeadUseCase } from "@/use-cases/leads/delete-lead";

// Manual DI: wire each Lead use case to the Prisma repository.
export function makeCreateLeadUseCase() {
  return new CreateLeadUseCase(new PrismaLeadsRepository());
}

export function makeListLeadsUseCase() {
  return new ListLeadsUseCase(new PrismaLeadsRepository());
}

export function makeDeleteLeadUseCase() {
  return new DeleteLeadUseCase(new PrismaLeadsRepository());
}
