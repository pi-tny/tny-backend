import { PrismaImagesRepository } from "@/repositories/prisma/prisma-images-repository";
import { AddProductImageUseCase } from "@/use-cases/images/add-product-image";
import { UpdateImageUseCase } from "@/use-cases/images/update-image";
import { DeleteImageUseCase } from "@/use-cases/images/delete-image";

// Manual DI: wire each Image use case to the Prisma repository.
export function makeAddProductImageUseCase() {
  return new AddProductImageUseCase(new PrismaImagesRepository());
}

export function makeUpdateImageUseCase() {
  return new UpdateImageUseCase(new PrismaImagesRepository());
}

export function makeDeleteImageUseCase() {
  return new DeleteImageUseCase(new PrismaImagesRepository());
}
