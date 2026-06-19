import { PrismaOrdersRepository } from "@/repositories/prisma/prisma-orders-repository";
import { CreateOrderUseCase } from "@/use-cases/orders/create-order";
import { ListOrdersUseCase } from "@/use-cases/orders/list-orders";
import { GetOrderUseCase } from "@/use-cases/orders/get-order";
import { UpdateOrderStatusUseCase } from "@/use-cases/orders/update-order-status";

// Manual DI: wire each Order use case to the Prisma repository.
export function makeCreateOrderUseCase() {
  return new CreateOrderUseCase(new PrismaOrdersRepository());
}

export function makeListOrdersUseCase() {
  return new ListOrdersUseCase(new PrismaOrdersRepository());
}

export function makeGetOrderUseCase() {
  return new GetOrderUseCase(new PrismaOrdersRepository());
}

export function makeUpdateOrderStatusUseCase() {
  return new UpdateOrderStatusUseCase(new PrismaOrdersRepository());
}
