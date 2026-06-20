import type {
  ProductDetail,
  ProductsRepository,
} from "@/repositories/products-repository";
import { ProductSkuAlreadyExistsError } from "@/use-cases/errors/product-sku-already-exists-error";
import { InvalidPromotionalPriceError } from "@/use-cases/errors/invalid-promotional-price-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateProductUseCaseRequest {
  id: number;
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  promotional_price?: number | null;
  active?: boolean;
  category_ids?: number[];
}

interface UpdateProductUseCaseResponse {
  product: ProductDetail;
}

export class UpdateProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    id,
    ...data
  }: UpdateProductUseCaseRequest): Promise<UpdateProductUseCaseResponse> {
    if (data.sku !== undefined) {
      const existing = await this.productsRepository.findBySku(data.sku);
      if (existing && existing.id !== id) {
        throw new ProductSkuAlreadyExistsError();
      }
    }

    const current = await this.productsRepository.findDetail(id, true);
    if (!current) {
      throw new ResourceNotFoundError();
    }

    // Validate the rule against the values the product will end up with, since a
    // partial update may touch only price or only promotional_price.
    const resultingPrice = data.price ?? current.price;
    const resultingPromotionalPrice =
      data.promotional_price !== undefined
        ? data.promotional_price
        : current.promotional_price;
    if (
      resultingPromotionalPrice != null &&
      resultingPromotionalPrice >= resultingPrice
    ) {
      throw new InvalidPromotionalPriceError();
    }

    const product = await this.productsRepository.update(id, data);

    if (!product) {
      throw new ResourceNotFoundError();
    }

    return { product };
  }
}
