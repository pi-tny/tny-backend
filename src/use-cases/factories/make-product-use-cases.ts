import { PrismaProductsRepository } from "@/repositories/prisma/prisma-products-repository";
import { ListProductsUseCase } from "@/use-cases/products/list-products";
import { GetProductUseCase } from "@/use-cases/products/get-product";
import { GetRelatedProductsUseCase } from "@/use-cases/products/get-related-products";
import { CreateProductUseCase } from "@/use-cases/products/create-product";
import { UpdateProductUseCase } from "@/use-cases/products/update-product";
import { DeleteProductUseCase } from "@/use-cases/products/delete-product";
import { SetProductCategoriesUseCase } from "@/use-cases/products/set-product-categories";

// Manual DI: wire each Product use case to the Prisma repository.
export function makeListProductsUseCase() {
  return new ListProductsUseCase(new PrismaProductsRepository());
}

export function makeGetProductUseCase() {
  return new GetProductUseCase(new PrismaProductsRepository());
}

export function makeGetRelatedProductsUseCase() {
  return new GetRelatedProductsUseCase(new PrismaProductsRepository());
}

export function makeCreateProductUseCase() {
  return new CreateProductUseCase(new PrismaProductsRepository());
}

export function makeUpdateProductUseCase() {
  return new UpdateProductUseCase(new PrismaProductsRepository());
}

export function makeDeleteProductUseCase() {
  return new DeleteProductUseCase(new PrismaProductsRepository());
}

export function makeSetProductCategoriesUseCase() {
  return new SetProductCategoriesUseCase(new PrismaProductsRepository());
}
