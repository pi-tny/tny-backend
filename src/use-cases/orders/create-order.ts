import { resolveFinalPrice } from "@/utils/product-view";
import type {
  OrderDetail,
  OrdersRepository,
  ResolvedOrderItem,
} from "@/repositories/orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { InsufficientStockError } from "@/use-cases/errors/insufficient-stock-error";

interface CreateOrderItemInput {
  variant_id: number;
  quantity: number;
}

interface CreateOrderUseCaseRequest {
  name: string;
  phone: string;
  email?: string | null;
  payment_method?: string;
  message?: string | null;
  notes?: string | null;
  items: CreateOrderItemInput[];
}

interface CreateOrderUseCaseResponse {
  order: OrderDetail;
}

export class CreateOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    items,
    ...data
  }: CreateOrderUseCaseRequest): Promise<CreateOrderUseCaseResponse> {
    const resolved: ResolvedOrderItem[] = [];

    for (const item of items) {
      const snapshot = await this.ordersRepository.findVariantSnapshot(
        item.variant_id,
      );
      if (!snapshot) {
        throw new ResourceNotFoundError();
      }

      // Reject orders that exceed available stock.
      if (item.quantity > snapshot.quantity) {
        throw new InsufficientStockError();
      }

      // Freeze details and resolve the effective price at purchase time.
      const unit_price = resolveFinalPrice(
        {
          price: snapshot.product_price,
          promotional_price: snapshot.product_promotional_price,
        },
        { price: snapshot.price },
      );

      resolved.push({
        variant_id: item.variant_id,
        product_name: snapshot.product_name,
        color: snapshot.color,
        size: snapshot.size,
        quantity: item.quantity,
        unit_price,
      });
    }

    const total = resolved.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );

    const order = await this.ordersRepository.create({ ...data, total }, resolved);

    return { order };
  }
}
