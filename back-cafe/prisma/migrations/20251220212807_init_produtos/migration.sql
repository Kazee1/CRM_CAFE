-- CreateTable
CREATE TABLE "Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "tipoProduto" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "precoVenda" DECIMAL NOT NULL,
    "custoUnitario" DECIMAL,
    "estoque" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cafe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "tipoCafe" TEXT NOT NULL,
    "pontuacaoSCA" REAL,
    "pesoGramas" INTEGER NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "dataTorra" DATETIME NOT NULL,
    "dataValidade" DATETIME NOT NULL,
    "fornecedor" TEXT NOT NULL,
    CONSTRAINT "Cafe_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Acessorio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "produtoId" INTEGER NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "Acessorio_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComboItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "comboId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    CONSTRAINT "ComboItem_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ComboItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cafe_produtoId_key" ON "Cafe"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "Acessorio_produtoId_key" ON "Acessorio"("produtoId");
