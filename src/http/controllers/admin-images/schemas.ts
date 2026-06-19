import { z } from "zod";

export const imageIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Images reference an already-hosted url (no binary upload backend configured).
export const imageCreateSchema = z.object({
  url: z.string().min(1),
  variant_id: z.number().int().positive().nullish(),
  alt_text: z.string().nullish(),
  position: z.number().int().min(0).optional(),
});

export const imageUpdateSchema = z.object({
  variant_id: z.number().int().positive().nullish(),
  alt_text: z.string().nullish(),
  position: z.number().int().min(0).optional(),
});

export type ImageIdParam = z.infer<typeof imageIdParamSchema>;
export type ImageCreateBody = z.infer<typeof imageCreateSchema>;
export type ImageUpdateBody = z.infer<typeof imageUpdateSchema>;
