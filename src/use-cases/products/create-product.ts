import type {
  ProductDetail,
  ProductsRepository,
} from "@/repositories/products-repository";
import { ProductSkuAlreadyExistsError } from "@/use-cases/errors/product-sku-already-exists-error";
import { InvalidPromotionalPriceError } from "@/use-cases/errors/invalid-promotional-price-error";

interface CreateProductUseCaseRequest {
  sku: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number | null;
  active?: boolean;
  category_ids?: number[];
}

interface CreateProductUseCaseResponse {
  product: ProductDetail;
}

export class CreateProductUseCase {
  constructor(private productsRepository: ProductsRepository) {}

  async execute(
    data: CreateProductUseCaseRequest,
  ): Promise<CreateProductUseCaseResponse> {
    const existing = await this.productsRepository.findBySku(data.sku);

    if (existing) {
      throw new ProductSkuAlreadyExistsError();
    }

    if (data.promotional_price != null && data.promotional_price >= data.price) {
      throw new InvalidPromotionalPriceError();
    }

    const product = await this.productsRepository.create(data);

    return { product };
  }
}
