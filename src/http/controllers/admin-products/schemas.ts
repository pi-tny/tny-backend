import { z } from "zod";

// admin list accepts an explicit active filter; absent = all products. A string
// query param needs an explicit true/false mapping (z.coerce.boolean treats any
// non-empty string as true).
export const adminListProductsQuerySchema = z.object({
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  category_id: z.coerce.number().int().positive().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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
