import { z } from "zod";

export const leadCreateSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email(),
  phone: z.string().min(1),
  marketing_consent: z.boolean().optional(),
});

export const leadSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  marketing_consent: z.boolean(),
  consent_date: z.date(),
  created_at: z.date(),
});

export const leadIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listLeadsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type LeadCreateBody = z.infer<typeof leadCreateSchema>;
export type LeadIdParam = z.infer<typeof leadIdParamSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
