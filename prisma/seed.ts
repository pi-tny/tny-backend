import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

function image(seed: string, position: number) {
  return {
    url: `https://picsum.photos/seed/${seed}/600/800`,
    alt_text: null,
    position,
  };
}

async function main() {
  // Idempotent: wipe everything first (FK-safe order).
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.image.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.admin.deleteMany();

  // --- Admin ---
  const adminPassword = "admin123";
  const admin = await prisma.admin.create({
    data: {
      name: "Administrador TNY",
      email: "admin@tny.dev",
      password_hash: await hash(adminPassword, 6),
    },
  });

  // --- Categories ---
  const categoryNames = [
    "Camisetas",
    "Calças",
    "Bermudas",
    "Acessórios",
    "Lançamentos",
  ] as const;

  const categories: Record<string, number> = {};
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name, description: `Produtos da categoria ${name}.` },
    });
    categories[name] = category.id;
  }

  // --- Products (some on sale via promotional_price, some not) ---
  type ProductSeed = {
    sku: string;
    name: string;
    description: string;
    price: number;
    promotional_price?: number;
    categories: (typeof categoryNames)[number][];
    variants: {
      variant_sku: string;
      color: string;
      size: string;
      quantity: number;
      price?: number;
    }[];
    images: { seed: string; position: number }[];
  };

  const products: ProductSeed[] = [
    {
      sku: "CAM-BAS",
      name: "Camiseta Básica",
      description: "Camiseta de algodão, corte regular.",
      price: 59.9,
      categories: ["Camisetas"],
      variants: [
        {
          variant_sku: "CAM-BAS-PRE-M",
          color: "Preto",
          size: "M",
          quantity: 20,
        },
        {
          variant_sku: "CAM-BAS-PRE-G",
          color: "Preto",
          size: "G",
          quantity: 15,
        },
        {
          variant_sku: "CAM-BAS-BRA-M",
          color: "Branco",
          size: "M",
          quantity: 12,
        },
      ],
      images: [
        { seed: "cam-bas-1", position: 0 },
        { seed: "cam-bas-2", position: 1 },
      ],
    },
    {
      sku: "CAM-EST",
      name: "Camiseta Estampada",
      description: "Camiseta com estampa exclusiva da coleção.",
      price: 79.9,
      promotional_price: 59.9,
      categories: ["Camisetas", "Lançamentos"],
      variants: [
        { variant_sku: "CAM-EST-AZU-P", color: "Azul", size: "P", quantity: 8 },
        {
          variant_sku: "CAM-EST-AZU-M",
          color: "Azul",
          size: "M",
          quantity: 10,
        },
      ],
      images: [{ seed: "cam-est-1", position: 0 }],
    },
    {
      sku: "CAL-JEA",
      name: "Calça Jeans",
      description: "Calça jeans slim, lavagem média.",
      price: 159.9,
      categories: ["Calças"],
      variants: [
        { variant_sku: "CAL-JEA-38", color: "Azul", size: "38", quantity: 6 },
        {
          variant_sku: "CAL-JEA-40",
          color: "Azul",
          size: "40",
          quantity: 9,
          price: 169.9,
        },
      ],
      images: [{ seed: "cal-jea-1", position: 0 }],
    },
    {
      sku: "CAL-MOL",
      name: "Calça Moletom",
      description: "Calça de moletom flanelado, confortável.",
      price: 129.9,
      promotional_price: 99.9,
      categories: ["Calças"],
      variants: [
        {
          variant_sku: "CAL-MOL-CIN-M",
          color: "Cinza",
          size: "M",
          quantity: 14,
        },
        {
          variant_sku: "CAL-MOL-CIN-G",
          color: "Cinza",
          size: "G",
          quantity: 7,
        },
      ],
      images: [
        { seed: "cal-mol-1", position: 0 },
        { seed: "cal-mol-2", position: 1 },
      ],
    },
    {
      sku: "BER-TAC",
      name: "Bermuda Tactel",
      description: "Bermuda leve para o dia a dia.",
      price: 89.9,
      categories: ["Bermudas"],
      variants: [
        {
          variant_sku: "BER-TAC-PRE-M",
          color: "Preto",
          size: "M",
          quantity: 11,
        },
        {
          variant_sku: "BER-TAC-VER-G",
          color: "Verde",
          size: "G",
          quantity: 5,
        },
      ],
      images: [{ seed: "ber-tac-1", position: 0 }],
    },
    {
      sku: "ACE-BON",
      name: "Boné Aba Curva",
      description: "Boné ajustável, bordado frontal.",
      price: 49.9,
      promotional_price: 39.9,
      categories: ["Acessórios", "Lançamentos"],
      variants: [
        {
          variant_sku: "ACE-BON-PRE-U",
          color: "Preto",
          size: "Único",
          quantity: 25,
        },
        {
          variant_sku: "ACE-BON-BEG-U",
          color: "Bege",
          size: "Único",
          quantity: 18,
        },
      ],
      images: [{ seed: "ace-bon-1", position: 0 }],
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        promotional_price: product.promotional_price ?? null,
        variants: {
          create: product.variants.map((variant) => ({
            variant_sku: variant.variant_sku,
            color: variant.color,
            size: variant.size,
            quantity: variant.quantity,
            price: variant.price ?? null,
          })),
        },
        images: {
          create: product.images.map((img) => image(img.seed, img.position)),
        },
        categories: {
          create: product.categories.map((name) => ({
            category: { connect: { id: categories[name] } },
          })),
        },
      },
    });
  }

  console.log("🌱 Seed concluído:");
  console.log(`   Admin: ${admin.email} / senha: ${adminPassword}`);
  console.log(
    `   ${categoryNames.length} categorias, ${products.length} produtos`,
  );
  console.log("   0 pedidos, 0 leads");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
