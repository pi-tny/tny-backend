import type { ProductsRepository } from "@/repositories/products-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteProductUseCaseRequest {
  id: number;
}

export class DeleteProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({ id }: DeleteProductUseCaseRequest): Promise<void> {
    const deleted = await this.productsRepository.softDelete(id);

    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
