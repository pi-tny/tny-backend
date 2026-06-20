import { z } from "zod";
import {
  booleanQuery,
  productFilterFields,
} from "@/http/controllers/products/schemas";

// admin list reuses the public filters and adds an explicit active filter;
// absent active = all products (including inactive).
export const adminListProductsQuerySchema = z.object({
  ...productFilterFields,
  active: booleanQuery.optional(),
});

export const productCreateSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  description: z.string().min(1),
  price: z.number().min(0),
  promotional_price: z.number().min(0).nullish(),
  active: z.boolean().optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
});

export const productUpdateSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  promotional_price: z.number().min(0).nullish(),
  active: z.boolean().optional(),
  category_ids: z.array(z.number().int().positive()).optional(),
});

export const setCategoriesBodySchema = z.object({
  category_ids: z.array(z.number().int().positive()),
});

export type AdminListProductsQuery = z.infer<
  typeof adminListProductsQuerySchema
>;
export type ProductCreateBody = z.infer<typeof productCreateSchema>;
export type ProductUpdateBody = z.infer<typeof productUpdateSchema>;
export type SetCategoriesBody = z.infer<typeof setCategoriesBodySchema>;
