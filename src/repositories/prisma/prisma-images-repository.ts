import { Prisma } from "../../../generated/prisma";
import { prisma } from "@/lib/prisma";
import type {
  CreateImageData,
  ImagesRepository,
  UpdateImageData,
} from "@/repositories/images-repository";

export class PrismaImagesRepository implements ImagesRepository {
  async create(productId: number, data: CreateImageData) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!product) return null;

    if (data.variant_id != null) {
      const variant = await prisma.variant.findUnique({
        where: { id: data.variant_id },
        select: { product_id: true },
      });
      if (!variant || variant.product_id !== productId) return null;
    }

    return prisma.image.create({
      data: {
        product_id: productId,
        variant_id: data.variant_id ?? null,
        url: data.url,
        alt_text: data.alt_text ?? null,
        position: data.position ?? 0,
      },
    });
  }

  async update(id: number, data: UpdateImageData) {
    try {
      return await prisma.image.update({
        where: { id },
        data: {
          variant_id: data.variant_id,
          alt_text: data.alt_text,
          position: data.position,
        },
      });
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

  async delete(id: number) {
    try {
      await prisma.image.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return false;
      }
      throw error;
    }
  }
}
