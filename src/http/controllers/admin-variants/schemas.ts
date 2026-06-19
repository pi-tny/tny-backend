import { z } from "zod";

export const variantIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const variantCreateSchema = z.object({
  variant_sku: z.string().min(1),
  color: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(0),
  price: z.number().min(0).nullish(),
});

export const variantUpdateSchema = z.object({
  variant_sku: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  size: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  price: z.number().min(0).nullish(),
});

export type VariantIdParam = z.infer<typeof variantIdParamSchema>;
export type VariantCreateBody = z.infer<typeof variantCreateSchema>;
export type VariantUpdateBody = z.infer<typeof variantUpdateSchema>;
