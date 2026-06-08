-- CreateTable
CREATE TABLE "produtos" (
    "id_produto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_cadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "produto_categoria" (
    "id_produto" INTEGER NOT NULL,
    "id_categoria" INTEGER NOT NULL,

    PRIMARY KEY ("id_produto", "id_categoria"),
    CONSTRAINT "produto_categoria_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos" ("id_produto") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "produto_categoria_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias" ("id_categoria") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "itens" (
    "id_item" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_produto" INTEGER NOT NULL,
    "sku_variacao" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco" REAL,
    CONSTRAINT "itens_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos" ("id_produto") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "imagens" (
    "id_imagem" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_produto" INTEGER NOT NULL,
    "id_item" INTEGER,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    CONSTRAINT "imagens_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "produtos" ("id_produto") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "imagens_id_item_fkey" FOREIGN KEY ("id_item") REFERENCES "itens" ("id_item") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id_lead" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "data_cadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentimento_marketing" BOOLEAN NOT NULL DEFAULT true,
    "data_consentimento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id_pedido" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "forma_pag" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "obs" TEXT NOT NULL,
    "data_contato" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor_total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'novo'
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id_item_pedido" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pedido" INTEGER NOT NULL,
    "id_item" INTEGER NOT NULL,
    "nome_produto" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" REAL NOT NULL,
    CONSTRAINT "itens_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedidos" ("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "itens_pedido_id_item_fkey" FOREIGN KEY ("id_item") REFERENCES "itens" ("id_item") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admins" (
    "id_admin" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_cadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "itens_sku_variacao_key" ON "itens"("sku_variacao");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
