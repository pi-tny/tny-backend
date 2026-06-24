import { z } from "zod";
import { paginationMetaSchema } from "@/http/http-schemas";

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const categorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});

export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const categoryListResponseSchema = z.object({
  data: z.array(categorySchema),
  meta: paginationMetaSchema,
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
