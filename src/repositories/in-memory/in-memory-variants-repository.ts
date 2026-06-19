import type { Variant } from "../../../generated/prisma";
import { resolveFinalPrice } from "@/utils/product-view";
import type { VariantView } from "@/repositories/products-repository";
import type {
  CreateVariantData,
  UpdateVariantData,
  VariantsRepository,
} from "@/repositories/variants-repository";

interface PriceParts {
  id: number;
  price: number;
  promotional_price: number | null;
}

export class InMemoryVariantsRepository implements VariantsRepository {
  // Seed price parts of the products the variants belong to (for final_price).
  public products: PriceParts[] = [];
  public items: Variant[] = [];
  private nextId = 1;

  private view(variant: Variant): VariantView {
    const product = this.products.find((p) => p.id === variant.product_id);
    const finalPrice = product
      ? resolveFinalPrice(product, variant)
      : (variant.price ?? 0);
    return {
      id: variant.id,
      product_id: variant.product_id,
      variant_sku: variant.variant_sku,
      color: variant.color,
      size: variant.size,
      quantity: variant.quantity,
      price: variant.price,
      final_price: finalPrice,
    };
  }

  async findBySku(variantSku: string) {
    const variant = this.items.find((item) => item.variant_sku === variantSku);
    return variant ? { id: variant.id } : null;
  }

  async listByProduct(productId: number) {
    return this.items
      .filter((item) => item.product_id === productId)
      .sort((a, b) => a.id - b.id)
      .map((item) => this.view(item));
  }

  async create(productId: number, data: CreateVariantData) {
    if (!this.products.some((p) => p.id === productId)) return null;

    const variant: Variant = {
      id: this.nextId++,
      product_id: productId,
      variant_sku: data.variant_sku,
      color: data.color,
      size: data.size,
      quantity: data.quantity,
      price: data.price ?? null,
    };
    this.items.push(variant);
    return this.view(variant);
  }

  async update(id: number, data: UpdateVariantData) {
    const variant = this.items.find((item) => item.id === id);
    if (!variant) return null;

    if (data.variant_sku !== undefined) variant.variant_sku = data.variant_sku;
    if (data.color !== undefined) variant.color = data.color;
    if (data.size !== undefined) variant.size = data.size;
    if (data.quantity !== undefined) variant.quantity = data.quantity;
    if (data.price !== undefined) variant.price = data.price;

    return this.view(variant);
  }

  async delete(id: number) {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }
}
