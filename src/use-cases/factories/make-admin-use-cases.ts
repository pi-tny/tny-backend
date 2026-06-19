import { PrismaAdminsRepository } from "@/repositories/prisma/prisma-admins-repository";
import { ListAdminsUseCase } from "@/use-cases/admins/list-admins";
import { CreateAdminUseCase } from "@/use-cases/admins/create-admin";
import { UpdateAdminUseCase } from "@/use-cases/admins/update-admin";
import { DeleteAdminUseCase } from "@/use-cases/admins/delete-admin";

// Manual DI: wire each Admin-management use case to the Prisma repository.
export function makeListAdminsUseCase() {
  return new ListAdminsUseCase(new PrismaAdminsRepository());
}

export function makeCreateAdminUseCase() {
  return new CreateAdminUseCase(new PrismaAdminsRepository());
}

export function makeUpdateAdminUseCase() {
  return new UpdateAdminUseCase(new PrismaAdminsRepository());
}

export function makeDeleteAdminUseCase() {
  return new DeleteAdminUseCase(new PrismaAdminsRepository());
}
