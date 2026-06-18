import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { ListCategoriesUseCase } from "@/use-cases/categories/list-categories";
import { GetCategoryUseCase } from "@/use-cases/categories/get-category";
import { CreateCategoryUseCase } from "@/use-cases/categories/create-category";
import { UpdateCategoryUseCase } from "@/use-cases/categories/update-category";
import { DeleteCategoryUseCase } from "@/use-cases/categories/delete-category";

// Manual DI: wire each Category use case to the Prisma repository implementation.
export function makeListCategoriesUseCase() {
  return new ListCategoriesUseCase(new PrismaCategoriesRepository());
}

export function makeGetCategoryUseCase() {
  return new GetCategoryUseCase(new PrismaCategoriesRepository());
}

export function makeCreateCategoryUseCase() {
  return new CreateCategoryUseCase(new PrismaCategoriesRepository());
}

export function makeUpdateCategoryUseCase() {
  return new UpdateCategoryUseCase(new PrismaCategoriesRepository());
}

export function makeDeleteCategoryUseCase() {
  return new DeleteCategoryUseCase(new PrismaCategoriesRepository());
}
