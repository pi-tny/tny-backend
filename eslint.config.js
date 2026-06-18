const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");

// Pragmatic guard for the "identifiers in English" rule: warns when a common
// Portuguese term is used as an identifier. Not exhaustive (can't truly detect
// language) — extend the list as needed. Portuguese is only allowed in user-facing
// message strings, explanatory comments and seed/example data, none of which are identifiers.
const portugueseTerms = [
  "produto",
  "produtos",
  "categoria",
  "categorias",
  "pedido",
  "pedidos",
  "item",
  "itens",
  "imagem",
  "imagens",
  "usuario",
  "usuarios",
  "senha",
  "nome",
  "endereco",
  "preco",
  "estoque",
  "cor",
  "tamanho",
  "cliente",
  "clientes",
  "entrega",
  "carrinho",
];

module.exports = tseslint.config(
  {
    ignores: ["dist", "generated", "node_modules", "build"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "id-denylist": ["warn", ...portugueseTerms],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
);
