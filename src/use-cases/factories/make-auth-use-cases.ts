import { PrismaAdminsRepository } from "@/repositories/prisma/prisma-admins-repository";
import { AuthenticateUseCase } from "@/use-cases/auth/authenticate";
import { GetAdminProfileUseCase } from "@/use-cases/auth/get-admin-profile";

// Manual DI: wire each auth use case to the Prisma admins repository.
export function makeAuthenticateUseCase() {
  return new AuthenticateUseCase(new PrismaAdminsRepository());
}

export function makeGetAdminProfileUseCase() {
  return new GetAdminProfileUseCase(new PrismaAdminsRepository());
}
