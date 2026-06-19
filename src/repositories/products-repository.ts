import type { Category, Image } from "../../generated/prisma";

export interface ProductSummary {
  id: number;
  sku: string;
  name: string;
  price: number;
  promotional_price: number | null;
  active: boolean;
  cover_image: string | null;
  categories: Category[];
}

export interface VariantView {
  id: number;
  product_id: number;
  variant_sku: string;
  color: string;
  size: string;
  quantity: number;
  price: number | null;
  final_price: number;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  created_at: Date;
  variants: VariantView[];
  images: Image[];
}

export interface ProductListResult {
  items: ProductSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface ListProductsFilters {
  categoryId?: number;
  q?: string;
  active?: boolean;
  page: number;
  limit: number;
}

export interface CreateProductData {
  sku: string;
  name: string;
  description: string;
  price: number;
  promotional_price?: number | null;
  active?: boolean;
  category_ids?: number[];
}

export interface UpdateProductData {
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  promotional_price?: number | null;
  active?: boolean;
  category_ids?: number[];
}

export interface ProductsRepository {
  findBySku(sku: string): Promise<{ id: number } | null>;
  exists(id: number): Promise<boolean>;
  list(filters: ListProductsFilters): Promise<ProductListResult>;
  findDetail(id: number, includeInactive: boolean): Promise<ProductDetail | null>;
  findRelated(id: number, limit: number): Promise<ProductSummary[]>;
  create(data: CreateProductData): Promise<ProductDetail>;
  update(id: number, data: UpdateProductData): Promise<ProductDetail | null>;
  softDelete(id: number): Promise<boolean>;
  setCategories(id: number, categoryIds: number[]): Promise<Category[] | null>;
}
