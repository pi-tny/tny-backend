import { prisma } from "@/lib/prisma";

// Clears all tables between integration tests (FK-safe order).
export async function resetDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.image.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.admin.deleteMany();
}
