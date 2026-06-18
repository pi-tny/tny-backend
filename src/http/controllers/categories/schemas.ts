import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const categorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
