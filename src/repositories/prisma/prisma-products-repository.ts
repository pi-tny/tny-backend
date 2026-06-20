import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import { resolveCoverImage, resolveFinalPrice } from "@/utils/product-view";
import { insensitiveContains } from "@/utils/prisma-search";
import type {
  CreateProductData,
  ListProductsFilters,
  ProductDetail,
  ProductsRepository,
  ProductSummary,
  UpdateProductData,
} from "@/repositories/products-repository";

const summaryInclude = {
  categories: { include: { category: true } },
  images: true,
} satisfies Prisma.ProductInclude;

const detailInclude = {
  categories: { include: { category: true } },
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: { id: "asc" } },
} satisfies Prisma.ProductInclude;

type SummaryRow = Prisma.ProductGetPayload<{ include: typeof summaryInclude }>;
type DetailRow = Prisma.ProductGetPayload<{ include: typeof detailInclude }>;

function toSummary(product: SummaryRow): ProductSummary {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price,
    promotional_price: product.promotional_price,
    active: product.active,
    cover_image: resolveCoverImage(product.images),
    categories: product.categories.map((link) => link.category),
  };
}

function toDetail(product: DetailRow): ProductDetail {
  return {
    ...toSummary(product),
    description: product.description,
    created_at: product.created_at,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      product_id: variant.product_id,
      variant_sku: variant.variant_sku,
      color: variant.color,
      size: variant.size,
      quantity: variant.quantity,
      price: variant.price,
      final_price: resolveFinalPrice(product, variant),
    })),
    images: product.images,
  };
}

export class PrismaProductsRepository implements ProductsRepository {
  async findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku }, select: { id: true } });
  }

  async exists(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    return product !== null;
  }

  async list(filters: ListProductsFilters) {
    const where: Prisma.ProductWhereInput = {};
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.categoryId !== undefined) {
      where.categories = { some: { category_id: filters.categoryId } };
    }
    if (filters.q) where.name = insensitiveContains(filters.q);

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: summaryInclude,
        orderBy: { id: "asc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      items: rows.map(toSummary),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findDetail(id: number, includeInactive: boolean) {
    const product = await prisma.product.findFirst({
      where: includeInactive ? { id } : { id, active: true },
      include: detailInclude,
    });
    return product ? toDetail(product) : null;
  }

  async findRelated(id: number, limit: number) {
    const links = await prisma.productCategory.findMany({
      where: { product_id: id },
      select: { category_id: true },
    });
    const categoryIds = links.map((link) => link.category_id);
    if (categoryIds.length === 0) return [];

    const rows = await prisma.product.findMany({
      where: {
        id: { not: id },
        active: true,
        categories: { some: { category_id: { in: categoryIds } } },
      },
      include: summaryInclude,
      orderBy: { id: "asc" },
      take: limit,
    });
    return rows.map(toSummary);
  }

  async create(data: CreateProductData) {
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        price: data.price,
        promotional_price: data.promotional_price ?? null,
        active: data.active ?? true,
        categories: data.category_ids?.length
          ? {
              create: data.category_ids.map((category_id) => ({ category_id })),
            }
          : undefined,
      },
      include: detailInclude,
    });
    return toDetail(product);
  }

  async update(id: number, data: UpdateProductData) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            sku: data.sku,
            name: data.name,
            description: data.description,
            price: data.price,
            promotional_price: data.promotional_price,
            active: data.active,
          },
        });

        if (data.category_ids !== undefined) {
          await tx.productCategory.deleteMany({ where: { product_id: id } });
          if (data.category_ids.length > 0) {
            await tx.productCategory.createMany({
              data: data.category_ids.map((category_id) => ({
                product_id: id,
                category_id,
              })),
            });
          }
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return null;
      }
      throw error;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: detailInclude,
    });
    return product ? toDetail(product) : null;
  }

  async softDelete(id: number) {
    try {
      await prisma.product.update({ where: { id }, data: { active: false } });
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

  async setCategories(id: number, categoryIds: number[]) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!product) return null;

    await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { product_id: id } });
      if (categoryIds.length > 0) {
        await tx.productCategory.createMany({
          data: categoryIds.map((category_id) => ({
            product_id: id,
            category_id,
          })),
        });
      }
    });

    const links = await prisma.productCategory.findMany({
      where: { product_id: id },
      include: { category: true },
      orderBy: { category_id: "asc" },
    });
    return links.map((link) => link.category);
  }
}
