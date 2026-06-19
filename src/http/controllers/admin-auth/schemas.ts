import { z } from "zod";

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const tokenSchema = z.object({
  token: z.string(),
});

// Admin profile shape exposed to clients — never includes password_hash.
export const adminSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  created_at: z.date(),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
