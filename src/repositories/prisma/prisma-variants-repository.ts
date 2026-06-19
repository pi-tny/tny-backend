import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import { resolveFinalPrice } from "@/utils/product-view";
import type { VariantView } from "@/repositories/products-repository";
import type {
  CreateVariantData,
  UpdateVariantData,
  VariantsRepository,
} from "@/repositories/variants-repository";

type VariantRow = Prisma.VariantGetPayload<{ include: { product: true } }>;

function toView(variant: VariantRow): VariantView {
  return {
    id: variant.id,
    product_id: variant.product_id,
    variant_sku: variant.variant_sku,
    color: variant.color,
    size: variant.size,
    quantity: variant.quantity,
    price: variant.price,
    final_price: resolveFinalPrice(variant.product, variant),
  };
}

export class PrismaVariantsRepository implements VariantsRepository {
  async findBySku(variantSku: string) {
    return prisma.variant.findUnique({
      where: { variant_sku: variantSku },
      select: { id: true },
    });
  }

  async listByProduct(productId: number) {
    const rows = await prisma.variant.findMany({
      where: { product_id: productId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
    return rows.map(toView);
  }

  async create(productId: number, data: CreateVariantData) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) return null;

    const variant = await prisma.variant.create({
      data: {
        product_id: productId,
        variant_sku: data.variant_sku,
        color: data.color,
        size: data.size,
        quantity: data.quantity,
        price: data.price ?? null,
      },
      include: { product: true },
    });
    return toView(variant);
  }

  async update(id: number, data: UpdateVariantData) {
    try {
      const variant = await prisma.variant.update({
        where: { id },
        data: {
          variant_sku: data.variant_sku,
          color: data.color,
          size: data.size,
          quantity: data.quantity,
          price: data.price,
        },
        include: { product: true },
      });
      return toView(variant);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }
  }

  async delete(id: number) {
    try {
      await prisma.variant.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }
}
