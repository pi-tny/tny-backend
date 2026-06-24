import { z } from "zod";

// shared response shapes (openapi Error / ValidationError envelope).
export const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export const validationErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.array(z.object({ field: z.string(), message: z.string() })),
  }),
});

export const dataResponse = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ data: schema });

// shared pagination meta (openapi PaginationMeta).
export const paginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
});

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
) {
  return { page, limit, total, total_pages: Math.ceil(total / limit) };
}
