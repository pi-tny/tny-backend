import type { VariantView } from "@/repositories/products-repository";
import type { VariantsRepository } from "@/repositories/variants-repository";

interface ListProductVariantsUseCaseRequest {
  productId: number;
}

interface ListProductVariantsUseCaseResponse {
  variants: VariantView[];
}

export class ListProductVariantsUseCase {
  constructor(private variantsRepository: VariantsRepository) {}

  async execute({
    productId,
  }: ListProductVariantsUseCaseRequest): Promise<ListProductVariantsUseCaseResponse> {
    const variants = await this.variantsRepository.listByProduct(productId);
    return { variants };
  }
}
