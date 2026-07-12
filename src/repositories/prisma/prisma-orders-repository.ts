import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import type {
  CreateOrderData,
  ListOrdersFilters,
  OrderDetail,
  OrdersRepository,
  ResolvedOrderItem,
} from "@/repositories/orders-repository";

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

function toDetail(order: OrderRow): OrderDetail {
  return {
    id: order.id,
    name: order.name,
    phone: order.phone,
    email: order.email,
    payment_method: order.payment_method,
    message: order.message,
    notes: order.notes,
    total: order.total,
    status: order.status,
    created_at: order.created_at,
    items: order.items.map((item) => ({
      id: item.id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    })),
  };
}

export class PrismaOrdersRepository implements OrdersRepository {
  async findVariantSnapshot(variantId: number) {
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) return null;

    return {
      color: variant.color,
      size: variant.size,
      price: variant.price,
      quantity: variant.quantity,
      product_name: variant.product.name,
      product_price: variant.product.price,
      product_promotional_price: variant.product.promotional_price,
    };
  }

  async create(data: CreateOrderData, items: ResolvedOrderItem[]) {
    // creates the order and decrements the variants' stock atomically.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email ?? null,
          payment_method: data.payment_method ?? "to_be_defined",
          message: data.message ?? null,
          notes: data.notes ?? null,
          total: data.total,
          items: {
            create: items.map((item) => ({
              variant_id: item.variant_id,
              product_name: item.product_name,
              color: item.color,
              size: item.size,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.variant.update({
          where: { id: item.variant_id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return toDetail(order);
  }

  async list(filters: ListOrdersFilters) {
    const createdAt =
      filters.createdFrom || filters.createdBefore
        ? { gte: filters.createdFrom, lt: filters.createdBefore }
        : undefined;
    const where: Prisma.OrderWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(createdAt ? { created_at: createdAt } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => ({
        id: order.id,
        name: order.name,
        phone: order.phone,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
      })),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async findById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return order ? toDetail(order) : null;
  }

  async updateStatus(id: number, status: string) {
    try {
      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: { items: true },
      });
      return toDetail(order);
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
}
