import type {
  CreateOrderData,
  OrderDetail,
  OrderItemView,
  OrderSummary,
  OrdersRepository,
  OrderVariantSnapshot,
  ResolvedOrderItem,
} from "@/repositories/orders-repository";

type StoredOrder = OrderDetail;

export class InMemoryOrdersRepository implements OrdersRepository {
  // Seed variant snapshots keyed by variant id (the data the use case freezes).
  public snapshots = new Map<number, OrderVariantSnapshot>();
  public items: StoredOrder[] = [];
  private nextOrderId = 1;
  private nextItemId = 1;

  async findVariantSnapshot(variantId: number) {
    return this.snapshots.get(variantId) ?? null;
  }

  async create(data: CreateOrderData, items: ResolvedOrderItem[]) {
    const itemViews: OrderItemView[] = items.map((item) => ({
      id: this.nextItemId++,
      variant_id: item.variant_id,
      product_name: item.product_name,
      color: item.color,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.unit_price * item.quantity,
    }));

    const order: StoredOrder = {
      id: this.nextOrderId++,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      payment_method: data.payment_method ?? "to_be_defined",
      message: data.message ?? null,
      notes: data.notes ?? null,
      total: data.total,
      status: "new",
      created_at: new Date(),
      items: itemViews,
    };
    this.items.push(order);
    return order;
  }

  async listAdmin(status?: string) {
    return this.items
      .filter((order) => (status ? order.status === status : true))
      .sort((a, b) => b.id - a.id)
      .map(
        (order): OrderSummary => ({
          id: order.id,
          name: order.name,
          phone: order.phone,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
        }),
      );
  }

  async findById(id: number) {
    return this.items.find((order) => order.id === id) ?? null;
  }

  async updateStatus(id: number, status: string) {
    const order = this.items.find((item) => item.id === id);
    if (!order) return null;
    order.status = status;
    return order;
  }
}
