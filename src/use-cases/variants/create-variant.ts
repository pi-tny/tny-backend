import type { VariantView } from "@/repositories/products-repository";
import type { VariantsRepository } from "@/repositories/variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { VariantSkuAlreadyExistsError } from "@/use-cases/errors/variant-sku-already-exists-error";

interface CreateVariantUseCaseRequest {
  productId: number;
  variant_sku: string;
  color: string;
  size: string;
  quantity: number;
  price?: number | null;
}

interface CreateVariantUseCaseResponse {
  variant: VariantView;
}

export class CreateVariantUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute({
    productId,
    ...data
  }: CreateVariantUseCaseRequest): Promise<CreateVariantUseCaseResponse> {
    const existing = await this.variantsRepository.findBySku(data.variant_sku);
    if (existing) {
      throw new VariantSkuAlreadyExistsError();
    }

    const variant = await this.variantsRepository.create(productId, data);
    if (!variant) {
      throw new ResourceNotFoundError();
    }

    return { variant };
  }
}
