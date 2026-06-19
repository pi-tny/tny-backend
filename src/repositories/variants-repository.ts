import type { VariantView } from "@/repositories/products-repository";

export interface CreateVariantData {
  variant_sku: string;
  color: string;
  size: string;
  quantity: number;
  price?: number | null;
}

export interface UpdateVariantData {
  variant_sku?: string;
  color?: string;
  size?: string;
  quantity?: number;
  price?: number | null;
}

export interface VariantsRepository {
  findBySku(variantSku: string): Promise<{ id: number } | null>;
  listByProduct(productId: number): Promise<VariantView[]>;
  // null when the product does not exist
  create(productId: number, data: CreateVariantData): Promise<VariantView | null>;
  // null when the variant does not exist
  update(id: number, data: UpdateVariantData): Promise<VariantView | null>;
  delete(id: number): Promise<boolean>;
}
