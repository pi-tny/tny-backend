import { z } from "zod";

export const adminIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const adminCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const adminUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  active: z.boolean().optional(),
});

export type AdminIdParam = z.infer<typeof adminIdParamSchema>;
export type AdminCreateBody = z.infer<typeof adminCreateSchema>;
export type AdminUpdateBody = z.infer<typeof adminUpdateSchema>;
