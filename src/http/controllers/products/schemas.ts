import { z } from "zod";
import { categorySchema } from "@/http/controllers/categories/schemas";
import {
  buildPaginationMeta,
  paginationMetaSchema,
} from "@/http/http-schemas";

// re-exported so existing imports keep working; defined in the neutral module
// to avoid a categories <-> products schema import cycle.
export { buildPaginationMeta, paginationMetaSchema };

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ---- response shapes (openapi ProductSummary / ProductDetail) ----
export const productSummarySchema = z.object({
  id: z.number().int(),
  sku: z.string(),
  name: z.string(),
  price: z.number(),
  promotional_price: z.number().nullable(),
  active: z.boolean(),
  cover_image: z.string().nullable(),
  categories: z.array(categorySchema),
});

export const variantViewSchema = z.object({
  id: z.number().int(),
  product_id: z.number().int(),
  variant_sku: z.string(),
  color: z.string(),
  size: z.string(),
  quantity: z.number().int(),
  price: z.number().nullable(),
  final_price: z.number(),
});

export const imageSchema = z.object({
  id: z.number().int(),
  product_id: z.number().int(),
  variant_id: z.number().int().nullable(),
  url: z.string(),
  alt_text: z.string().nullable(),
  position: z.number().int(),
});

export const productDetailSchema = productSummarySchema.extend({
  description: z.string(),
  created_at: z.date(),
  variants: z.array(variantViewSchema),
  images: z.array(imageSchema),
});

export const productListResponseSchema = z.object({
  data: z.array(productSummarySchema),
  meta: paginationMetaSchema,
});

// ---- request shapes ----
// A string query param needs an explicit true/false mapping (z.coerce.boolean
// treats any non-empty string as true).
export const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const productSortValues = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name",
] as const;

// Shared filter fields for the public and admin product listings.
export const productFilterFields = {
  category_id: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  on_sale: booleanQuery.optional(),
  in_stock: booleanQuery.optional(),
  sort: z.enum(productSortValues).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listProductsQuerySchema = z.object(productFilterFields);

export const relatedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(4),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type RelatedQuery = z.infer<typeof relatedQuerySchema>;
