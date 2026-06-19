import { PrismaVariantsRepository } from "@/repositories/prisma/prisma-variants-repository";
import { ListProductVariantsUseCase } from "@/use-cases/variants/list-product-variants";
import { CreateVariantUseCase } from "@/use-cases/variants/create-variant";
import { UpdateVariantUseCase } from "@/use-cases/variants/update-variant";
import { DeleteVariantUseCase } from "@/use-cases/variants/delete-variant";

// Manual DI: wire each Variant use case to the Prisma repository.
export function makeListProductVariantsUseCase() {
  return new ListProductVariantsUseCase(new PrismaVariantsRepository());
}

export function makeCreateVariantUseCase() {
  return new CreateVariantUseCase(new PrismaVariantsRepository());
}

export function makeUpdateVariantUseCase() {
  return new UpdateVariantUseCase(new PrismaVariantsRepository());
}

export function makeDeleteVariantUseCase() {
  return new DeleteVariantUseCase(new PrismaVariantsRepository());
}
