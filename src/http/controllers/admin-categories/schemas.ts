import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// CategoryCreate (openapi): name required (max 100), description optional/nullable.
export const categoryBodySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).nullish(),
});

export type CategoryIdParam = z.infer<typeof categoryIdParamSchema>;
export type CategoryBody = z.infer<typeof categoryBodySchema>;
