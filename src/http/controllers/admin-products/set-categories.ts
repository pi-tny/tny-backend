import type { FastifyReply, FastifyRequest } from "fastify";
import { makeSetProductCategoriesUseCase } from "@/use-cases/factories/make-product-use-cases";
import { mapDomainError } from "@/http/map-domain-error";
import type { ProductIdParam } from "@/http/controllers/products/schemas";
import type { SetCategoriesBody } from "./schemas";

export async function setCategories(
  request: FastifyRequest<{ Params: ProductIdParam; Body: SetCategoriesBody }>,
  reply: FastifyReply,
) {
  const { id } = request.params;
  const { category_ids } = request.body;

  try {
    const { categories } = await makeSetProductCategoriesUseCase().execute({
      id,
      categoryIds: category_ids,
    });
    return reply.status(200).send({ data: categories });
  } catch (error) {
    return mapDomainError(error, reply);
  }
}
