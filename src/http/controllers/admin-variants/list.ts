import type { FastifyReply, FastifyRequest } from "fastify";
import { makeListProductVariantsUseCase } from "@/use-cases/factories/make-variant-use-cases";
import type { ProductIdParam } from "@/http/controllers/products/schemas";

export async function list(
  request: FastifyRequest<{ Params: ProductIdParam }>,
  reply: FastifyReply,
) {
  const { id } = request.params;

  const { variants } = await makeListProductVariantsUseCase().execute({
    productId: id,
  });

  return reply.status(200).send({ data: variants });
}
