import { z } from "zod";

const paymentMethods = [
  "to_be_defined",
  "boleto",
  "credit_card",
  "cash",
  "pix",
  "bank_transfer",
] as const;

export const orderStatuses = ["new", "fulfilled", "ignored"] as const;

export const orderCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().nullish(),
  payment_method: z.enum(paymentMethods).optional(),
  message: z.string().nullish(),
  notes: z.string().nullish(),
  items: z
    .array(
      z.object({
        variant_id: z.number().int().positive(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1)
    .refine(
      (items) =>
        new Set(items.map((item) => item.variant_id)).size === items.length,
      { message: "items must not repeat the same variant_id" },
    ),
});

export const orderCreatedResponseSchema = z.object({
  data: z.object({
    id: z.number().int(),
    total: z.number(),
    status: z.string(),
    created_at: z.date(),
    whatsapp_url: z.string(),
    whatsapp_message: z.string(),
  }),
});

// admin
export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});

export const orderSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  phone: z.string(),
  total: z.number(),
  status: z.string(),
  created_at: z.date(),
});

export const orderItemSchema = z.object({
  id: z.number().int(),
  variant_id: z.number().int(),
  product_name: z.string(),
  color: z.string(),
  size: z.string(),
  quantity: z.number().int(),
  unit_price: z.number(),
  subtotal: z.number(),
});

export const orderDetailSchema = orderSummarySchema.extend({
  email: z.string().nullable(),
  payment_method: z.string(),
  message: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(orderItemSchema),
});

export type OrderCreateBody = z.infer<typeof orderCreateSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;
