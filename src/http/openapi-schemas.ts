import { z } from "zod";
import {
  errorResponseSchema,
  paginationMetaSchema,
  validationErrorResponseSchema,
} from "@/http/http-schemas";
import {
  imageSchema,
  productDetailSchema,
  productSummarySchema,
  variantViewSchema,
} from "@/http/controllers/products/schemas";
import { categorySchema } from "@/http/controllers/categories/schemas";
import {
  productCreateSchema,
  productUpdateSchema,
} from "@/http/controllers/admin-products/schemas";
import {
  variantCreateSchema,
  variantUpdateSchema,
} from "@/http/controllers/admin-variants/schemas";
import {
  imageCreateSchema,
  imageUpdateSchema,
} from "@/http/controllers/admin-images/schemas";
import { categoryBodySchema } from "@/http/controllers/admin-categories/schemas";
import { leadCreateSchema, leadSchema } from "@/http/controllers/leads/schemas";
import {
  orderCreatedResponseSchema,
  orderCreateSchema,
  orderDetailSchema,
  orderItemSchema,
  orderSummarySchema,
} from "@/http/controllers/orders/schemas";
import { adminSchema } from "@/http/controllers/admin-auth/schemas";
import {
  adminCreateSchema,
  adminUpdateSchema,
} from "@/http/controllers/admin-admins/schemas";

// Named OpenAPI components: registering a schema in Zod's global registry with an
// `id` makes fastify-type-provider-zod emit it under `components/schemas` and
// reference it with `$ref` everywhere it's used (instead of inlining). Only the
// reusable entity/body/response schemas are named; envelopes (`dataResponse`,
// list wrappers) and param/query schemas stay inline. Input positions get an
// `Input` suffix (`XxxInput`), output positions keep the bare `id`.
const namedSchemas: [z.ZodType, string][] = [
  [errorResponseSchema, "Error"],
  [validationErrorResponseSchema, "ValidationError"],
  [paginationMetaSchema, "PaginationMeta"],
  [categorySchema, "Category"],
  [categoryBodySchema, "CategoryCreate"],
  [productSummarySchema, "ProductSummary"],
  [productDetailSchema, "ProductDetail"],
  [productCreateSchema, "ProductCreate"],
  [productUpdateSchema, "ProductUpdate"],
  [variantViewSchema, "Variant"],
  [variantCreateSchema, "VariantCreate"],
  [variantUpdateSchema, "VariantUpdate"],
  [imageSchema, "Image"],
  [imageCreateSchema, "ImageCreate"],
  [imageUpdateSchema, "ImageUpdate"],
  [leadSchema, "Lead"],
  [leadCreateSchema, "LeadCreate"],
  [orderSummarySchema, "OrderSummary"],
  [orderDetailSchema, "OrderDetail"],
  [orderItemSchema, "OrderItem"],
  [orderCreateSchema, "OrderCreate"],
  [orderCreatedResponseSchema, "OrderCreatedResponse"],
  [adminSchema, "Admin"],
  [adminCreateSchema, "AdminCreate"],
  [adminUpdateSchema, "AdminUpdate"],
];

let registered = false;

// Idempotent: app.ts is imported once per test file (fresh module graph), so the
// global registry starts empty each time; the guard avoids a double-add otherwise.
export function registerNamedSchemas() {
  if (registered) return;
  registered = true;

  for (const [schema, id] of namedSchemas) {
    if (!z.globalRegistry.has(schema)) {
      z.globalRegistry.add(schema, { id });
    }
  }
}
