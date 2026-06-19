import type { Image } from "../../../generated/prisma";
import type { ImagesRepository } from "@/repositories/images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface AddProductImageUseCaseRequest {
  productId: number;
  url: string;
  variant_id?: number | null;
  alt_text?: string | null;
  position?: number;
}

interface AddProductImageUseCaseResponse {
  image: Image;
}

export class AddProductImageUseCase {
  constructor(private imagesRepository: ImagesRepository) {}

  async execute({
    productId,
    ...data
  }: AddProductImageUseCaseRequest): Promise<AddProductImageUseCaseResponse> {
    const image = await this.imagesRepository.create(productId, data);
    if (!image) {
      throw new ResourceNotFoundError();
    }

    return { image };
  }
}
