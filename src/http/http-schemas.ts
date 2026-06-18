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
