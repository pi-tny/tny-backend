import type {
  OrderSummary,
  OrdersRepository,
} from "@/repositories/orders-repository";

interface ListOrdersUseCaseRequest {
  status?: string;
}

interface ListOrdersUseCaseResponse {
  orders: OrderSummary[];
}

export class ListOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    status,
  }: ListOrdersUseCaseRequest): Promise<ListOrdersUseCaseResponse> {
    const orders = await this.ordersRepository.listAdmin(status);
    return { orders };
  }
}
