import type {
  OrderListResult,
  OrdersRepository,
} from "@/repositories/orders-repository";

interface ListOrdersUseCaseRequest {
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

interface ListOrdersUseCaseResponse {
  result: OrderListResult;
}

export class ListOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute({
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  }: ListOrdersUseCaseRequest): Promise<ListOrdersUseCaseResponse> {
    // date_to is inclusive of the whole day: bump it to the next midnight and
    // use an exclusive upper bound.
    const createdBefore = dateTo
      ? new Date(dateTo.getTime() + 24 * 60 * 60 * 1000)
      : undefined;

    const result = await this.ordersRepository.list({
      status,
      createdFrom: dateFrom,
      createdBefore,
      page,
      limit,
    });

    return { result };
  }
}
