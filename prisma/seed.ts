import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

// Pick the driver adapter the same way src/lib/prisma does, so the seed runs on
// both SQLite (dev) and Postgres (prod/docker).
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter =
  process.env.DATABASE_PROVIDER === "postgres"
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

function image(seed: string, position: number) {
  return {
    url: `https://picsum.photos/seed/${seed}/600/800`,
    alt_text: null,
    position,
  };
}

// Small deterministic PRNG (mulberry32) so reruns produce stable, collision-free data.
function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20260623);
const pick = <T>(items: readonly T[]) =>
  items[Math.floor(rng() * items.length)];
const int = (min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));
const round2 = (value: number) => Math.round(value * 100) / 100;

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
    "Moletons",
    "Jaquetas",
    "Camisas",
    "Shorts",
    "Saias",
    "Vestidos",
    "Blusas",
    "Casacos",
    "Calçados",
    "Bonés",
    "Meias",
    "Cuecas",
    "Promoções",
    "Infantil",
    "Esportivo",
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
    active?: boolean;
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
    {
      // active product that is fully out of stock (demos the in_stock filter)
      sku: "ACE-MEI",
      name: "Meia Cano Alto",
      description: "Meia esportiva, par.",
      price: 24.9,
      categories: ["Acessórios"],
      variants: [
        { variant_sku: "ACE-MEI-PRE-U", color: "Preto", size: "Único", quantity: 0 },
      ],
      images: [{ seed: "ace-mei-1", position: 0 }],
    },
    {
      // inactive product (soft-deleted): hidden from the public, visible to admin
      sku: "CAM-DESC",
      name: "Camiseta Descontinuada",
      description: "Item fora de linha.",
      price: 39.9,
      active: false,
      categories: ["Camisetas"],
      variants: [
        { variant_sku: "CAM-DESC-PRE-M", color: "Preto", size: "M", quantity: 3 },
      ],
      images: [{ seed: "cam-desc-1", position: 0 }],
    },
  ];

  // --- Bulk generated products (100+) ---
  // Build many products procedurally on top of the curated demo ones above, so
  // the catalog is large enough for realistic pagination/filtering.
  const productTypes = [
    { label: "Camiseta", prefix: "CAM", category: "Camisetas" },
    { label: "Calça", prefix: "CAL", category: "Calças" },
    { label: "Bermuda", prefix: "BER", category: "Bermudas" },
    { label: "Moletom", prefix: "MOL", category: "Moletons" },
    { label: "Jaqueta", prefix: "JAQ", category: "Jaquetas" },
    { label: "Camisa", prefix: "CMS", category: "Camisas" },
    { label: "Short", prefix: "SHO", category: "Shorts" },
    { label: "Saia", prefix: "SAI", category: "Saias" },
    { label: "Vestido", prefix: "VES", category: "Vestidos" },
    { label: "Blusa", prefix: "BLU", category: "Blusas" },
    { label: "Casaco", prefix: "CAS", category: "Casacos" },
    { label: "Tênis", prefix: "TEN", category: "Calçados" },
    { label: "Boné", prefix: "BON", category: "Bonés" },
    { label: "Meia", prefix: "MEI", category: "Meias" },
  ] as const;
  const adjectives = [
    "Básica",
    "Premium",
    "Slim",
    "Oversized",
    "Comfort",
    "Vintage",
    "Urban",
    "Sport",
    "Classic",
    "Eco",
    "Tech",
    "Street",
  ];
  const colors = [
    { name: "Preto", code: "PRE" },
    { name: "Branco", code: "BRA" },
    { name: "Azul", code: "AZU" },
    { name: "Cinza", code: "CIN" },
    { name: "Verde", code: "VER" },
    { name: "Vermelho", code: "VME" },
    { name: "Bege", code: "BEG" },
    { name: "Marinho", code: "MAR" },
    { name: "Vinho", code: "VIN" },
    { name: "Rosa", code: "ROS" },
  ];
  const sizes = ["PP", "P", "M", "G", "GG", "XG"];

  const GENERATED_COUNT = 120;
  for (let i = 0; i < GENERATED_COUNT; i++) {
    const type = productTypes[i % productTypes.length];
    const adjective = adjectives[i % adjectives.length];
    const seq = String(i + 1).padStart(3, "0");
    const sku = `${type.prefix}-${seq}`;
    const price = round2(int(2990, 29990) / 100);
    const onSale = rng() < 0.35;

    // Unique color/size combos for variants.
    const variantCount = int(2, 5);
    const usedCombos = new Set<string>();
    const variants: ProductSeed["variants"] = [];
    let attempts = 0;
    while (variants.length < variantCount && attempts < 30) {
      attempts++;
      const color = pick(colors);
      const size = pick(sizes);
      const combo = `${color.code}-${size}`;
      if (usedCombos.has(combo)) continue;
      usedCombos.add(combo);
      variants.push({
        variant_sku: `${sku}-${combo}`,
        color: color.name,
        size,
        quantity: int(0, 80),
        // ~20% of variants carry their own price override.
        price: rng() < 0.2 ? round2(price + int(500, 4000) / 100) : undefined,
      });
    }

    const productCategories: (typeof categoryNames)[number][] = [type.category];
    if (onSale) productCategories.push("Promoções");
    if (i % 9 === 0) productCategories.push("Lançamentos");
    if (i % 7 === 0) productCategories.push("Esportivo");

    products.push({
      sku,
      name: `${type.label} ${adjective} ${seq}`,
      description: `${type.label} ${adjective.toLowerCase()} da coleção TNY, modelo ${seq}.`,
      price,
      promotional_price: onSale ? round2(price * (0.6 + rng() * 0.25)) : undefined,
      active: rng() < 0.95,
      categories: productCategories,
      images: Array.from({ length: int(1, 3) }, (_, position) => ({
        seed: `${sku}-${position}`,
        position,
      })),
      variants,
    });
  }

  const createdProducts = [];
  for (const product of products) {
    const created = await prisma.product.create({
      data: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price,
        promotional_price: product.promotional_price ?? null,
        active: product.active ?? true,
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
      include: { variants: true },
    });
    createdProducts.push(created);
  }

  // --- Extra admins (admin management demo) — 5 total including the first ---
  const extraAdmins = [
    { name: "Operador TNY", email: "operador@tny.dev", password: "operador123" },
    { name: "Gerente TNY", email: "gerente@tny.dev", password: "gerente123" },
    { name: "Estoque TNY", email: "estoque@tny.dev", password: "estoque123" },
    { name: "Suporte TNY", email: "suporte@tny.dev", password: "suporte123" },
  ];
  for (const extra of extraAdmins) {
    await prisma.admin.create({
      data: {
        name: extra.name,
        email: extra.email,
        password_hash: await hash(extra.password, 6),
      },
    });
  }

  // --- Leads (100+) ---
  const firstNames = [
    "Maria", "João", "Ana", "Pedro", "Lucas", "Júlia", "Carlos", "Beatriz",
    "Rafael", "Fernanda", "Gustavo", "Camila", "Bruno", "Larissa", "Felipe",
    "Patrícia", "Rodrigo", "Amanda", "Thiago", "Mariana",
  ];
  const lastNames = [
    "Souza", "Lima", "Silva", "Oliveira", "Santos", "Pereira", "Costa",
    "Almeida", "Ferreira", "Rodrigues", "Gomes", "Martins", "Araújo", "Ribeiro",
  ];
  const leads: {
    name: string;
    email: string;
    phone: string;
    marketing_consent?: boolean;
  }[] = [];
  const usedEmails = new Set<string>();
  for (let i = 0; leads.length < 120; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const email = `lead${String(i + 1).padStart(4, "0")}@example.com`;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);
    leads.push({
      name,
      email,
      phone: `+55859${String(90000000 + i).slice(-8)}`,
      marketing_consent: rng() < 0.8,
    });
  }
  for (const lead of leads) {
    await prisma.lead.create({ data: lead });
  }

  // --- Orders (item details frozen at purchase time) ---
  const finalPrice = (
    product: { price: number; promotional_price: number | null },
    variant: { price: number | null },
  ) => product.promotional_price ?? variant.price ?? product.price;

  const orderItem = (sku: string, variantIndex: number, quantity: number) => {
    const product = createdProducts.find((item) => item.sku === sku);
    if (!product) throw new Error(`seed product ${sku} not found`);
    const variant = product.variants[variantIndex];
    return {
      variant_id: variant.id,
      product_name: product.name,
      color: variant.color,
      size: variant.size,
      quantity,
      unit_price: finalPrice(product, variant),
    };
  };
  const sum = (items: { unit_price: number; quantity: number }[]) =>
    items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);

  // Curated orders (reference the curated demo products).
  const order1Items = [orderItem("CAM-BAS", 0, 2), orderItem("CAL-JEA", 0, 1)];
  const order2Items = [orderItem("ACE-BON", 0, 3)];

  await prisma.order.create({
    data: {
      name: "Maria Souza",
      phone: "+5585999990001",
      email: "maria@example.com",
      payment_method: "pix",
      status: "new",
      total: sum(order1Items),
      items: { create: order1Items },
    },
  });
  await prisma.order.create({
    data: {
      name: "João Lima",
      phone: "+5585999990002",
      payment_method: "to_be_defined",
      status: "fulfilled",
      total: sum(order2Items),
      items: { create: order2Items },
    },
  });

  // --- Bulk generated orders (100+) ---
  const statuses = ["new", "processing", "fulfilled", "cancelled"];
  const paymentMethods = ["pix", "credit_card", "boleto", "to_be_defined"];
  const orderItemFromVariant = (
    product: (typeof createdProducts)[number],
    variant: (typeof createdProducts)[number]["variants"][number],
    quantity: number,
  ) => ({
    variant_id: variant.id,
    product_name: product.name,
    color: variant.color,
    size: variant.size,
    quantity,
    unit_price: finalPrice(product, variant),
  });

  const GENERATED_ORDERS = 120;
  for (let i = 0; i < GENERATED_ORDERS; i++) {
    const lead = leads[i % leads.length];
    const itemCount = int(1, 4);
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const product = pick(createdProducts);
      if (product.variants.length === 0) continue;
      const variant = pick(product.variants);
      items.push(orderItemFromVariant(product, variant, int(1, 3)));
    }
    if (items.length === 0) continue;
    await prisma.order.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: rng() < 0.7 ? lead.email : null,
        payment_method: pick(paymentMethods),
        status: pick(statuses),
        total: sum(items),
        items: { create: items },
      },
    });
  }

  const totalVariants = products.reduce((acc, p) => acc + p.variants.length, 0);
  const totalImages = products.reduce((acc, p) => acc + p.images.length, 0);
  const totalAdmins = 1 + extraAdmins.length;
  const totalOrders = 2 + GENERATED_ORDERS;
  console.log("🌱 Seed concluído:");
  console.log(`   Admin: ${admin.email} / senha: ${adminPassword}`);
  console.log(`   ${totalAdmins} admins (operador/gerente/estoque/suporte@tny.dev)`);
  console.log(`   ${categoryNames.length} categorias`);
  console.log(`   ${products.length} produtos, ${totalVariants} variantes, ${totalImages} imagens`);
  console.log(`   ${leads.length} leads, ~${totalOrders} pedidos`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
