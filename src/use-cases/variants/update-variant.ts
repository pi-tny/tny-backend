import type { VariantView } from "@/repositories/products-repository";
import type { VariantsRepository } from "@/repositories/variants-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { VariantSkuAlreadyExistsError } from "@/use-cases/errors/variant-sku-already-exists-error";

interface UpdateVariantUseCaseRequest {
  id: number;
  variant_sku?: string;
  color?: string;
  size?: string;
  quantity?: number;
  price?: number | null;
}

interface UpdateVariantUseCaseResponse {
  variant: VariantView;
}

export class UpdateVariantUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute({
    id,
    ...data
  }: UpdateVariantUseCaseRequest): Promise<UpdateVariantUseCaseResponse> {
    if (data.variant_sku !== undefined) {
      const existing = await this.variantsRepository.findBySku(
        data.variant_sku,
      );
      if (existing && existing.id !== id) {
        throw new VariantSkuAlreadyExistsError();
      }
    }

    const variant = await this.variantsRepository.update(id, data);
    if (!variant) {
      throw new ResourceNotFoundError();
    }

    return { variant };
  }
}
