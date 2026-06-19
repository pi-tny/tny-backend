import type { ImagesRepository } from "@/repositories/images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteImageUseCaseRequest {
  id: number;
}

export class DeleteImageUseCase {
  constructor(private imagesRepository: ImagesRepository) {}

  async execute({ id }: DeleteImageUseCaseRequest): Promise<void> {
    const deleted = await this.imagesRepository.delete(id);
    if (!deleted) {
      throw new ResourceNotFoundError();
    }
  }
}
