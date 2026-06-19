import type {
  OrderDetail,
  OrdersRepository,
} from "@/repositories/orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface GetOrderUseCaseRequest {
  id: number;
}

interface GetOrderUseCaseResponse {
  order: OrderDetail;
}

export class GetOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    id,
  }: GetOrderUseCaseRequest): Promise<GetOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(id);
    if (!order) {
      throw new ResourceNotFoundError();
    }

    return { order };
  }
}
