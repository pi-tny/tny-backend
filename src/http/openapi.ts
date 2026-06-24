import { env } from "@/env";

// Global OpenAPI document config consumed by @fastify/swagger (dynamic mode).
// Per-route summary/description/tags/security live on each route's `schema`; the
// request/response shapes are generated from the Zod schemas via
// `jsonSchemaTransform` (fastify-type-provider-zod). This replaces the old static
// docs/openapi.yaml — the routes are now the single source of truth.
export const openapiConfig = {
  openapi: "3.1.0",
  info: {
    title: "TNY Catálogo — API",
    description: [
      "API do catálogo online da TNY. Cobre as funcionalidades públicas do",
      "cliente (visualização de catálogo, carrinho/pedido via WhatsApp,",
      "newsletter) e as rotas administrativas.",
      "",
      "## Convenções",
      "- Identificadores, rotas e propriedades em inglês (`snake_case` em JSON).",
      "- Datas em ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).",
      "- Preços em decimal com 2 casas (ex.: `89.90`).",
      "- Paginação por `page` (1-indexed) e `limit`. Resposta inclui `meta`.",
      "- Rotas sob `/admin` exigem header `Authorization: Bearer <token>`.",
      "",
      "## Lógica de preço (herança Product → Variant) e promoção",
      "Cada Product pode ter `promotional_price` (nullable). Quando preenchido,",
      "o produto está em promoção. Regra do preço efetivo (`final_price` por",
      "Variant):",
      "1. Se `Product.promotional_price` está preenchido, é ele — para TODAS as",
      "   variações, independente do `Variant.price`.",
      "2. Caso contrário: `Variant.price` se existir, senão `Product.price`.",
      "",
      "## Imagens — regra de exibição",
      "Capa e galeria priorizam imagens com `variant_id = null`. Sem imagens",
      "gerais, o backend cai para as imagens da primeira variação; sem nenhuma,",
      "retorna `null` em `cover_image` e o cliente exibe placeholder.",
    ].join("\n"),
    version: "1.0.0",
    contact: { name: "Projeto Integrador I — TNY" },
  },
  servers: [
    { url: `http://localhost:${env.PORT}`, description: "Local" },
    { url: "https://api.tny.example.com", description: "Produção" },
  ],
  tags: [
    {
      name: "Categories (public)",
      description: "Listagem de categorias para navegação do cliente.",
    },
    {
      name: "Products (public)",
      description: "Catálogo, busca e detalhes dos produtos.",
    },
    {
      name: "Orders (public)",
      description: "Registro de pedidos antes do redirecionamento ao WhatsApp.",
    },
    {
      name: "Leads (public)",
      description: "Cadastro opcional para newsletter/promoções.",
    },
    { name: "Authentication", description: "Login e sessão do administrador." },
    { name: "Admin — Products" },
    { name: "Admin — Variants" },
    { name: "Admin — Images" },
    { name: "Admin — Categories" },
    { name: "Admin — Orders" },
    { name: "Admin — Leads" },
    { name: "Admin — Administrators" },
    { name: "Health" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http" as const,
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

// OpenAPI security requirement for the Bearer-only admin routes. Put it on each
// admin route's `schema.security` (the routes are also guarded at runtime by the
// verifyJwt hook).
export const bearerSecurity = [{ bearerAuth: [] as string[] }];
