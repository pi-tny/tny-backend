import type {
  OrderDetail,
  OrdersRepository,
} from "@/repositories/orders-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateOrderStatusUseCaseRequest {
  id: number;
  status: string;
}

interface UpdateOrderStatusUseCaseResponse {
  order: OrderDetail;
}

export class UpdateOrderStatusUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    id,
    status,
  }: UpdateOrderStatusUseCaseRequest): Promise<UpdateOrderStatusUseCaseResponse> {
    const order = await this.ordersRepository.updateStatus(id, status);
    if (!order) {
      throw new ResourceNotFoundError();
    }

    return { order };
  }
}
