import type { Image } from "../../../generated/prisma";
import type { ImagesRepository } from "@/repositories/images-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateImageUseCaseRequest {
  id: number;
  variant_id?: number | null;
  alt_text?: string | null;
  position?: number;
}

interface UpdateImageUseCaseResponse {
  image: Image;
}

export class UpdateImageUseCase {
  constructor(private imagesRepository: ImagesRepository) {}

  async execute({
    id,
    ...data
  }: UpdateImageUseCaseRequest): Promise<UpdateImageUseCaseResponse> {
    const image = await this.imagesRepository.update(id, data);
    if (!image) {
      throw new ResourceNotFoundError();
    }

    return { image };
  }
}
