# ☕ CRM Café

![Linguagem](https://img.shields.io/badge/language-TypeScript-3178C6)
![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-000000)
![Backend](https://img.shields.io/badge/backend-NestJS%2011-E0234E)
![Banco](https://img.shields.io/badge/banco-SQLite%20%2F%20Prisma-003B57)
![Versão](https://img.shields.io/badge/version-0.0.1-blue)

Sistema de CRM para operação comercial de uma empresa de café. Centraliza cadastro de clientes, catálogo de produtos, controle de pedidos e estoque, gestão de funcionários, dashboard de KPIs e relatórios exportáveis.

---

## ✨ Funcionalidades

- Autenticação com JWT em cookie `httpOnly`
- Cadastro e gestão de clientes (pessoa física e jurídica) com consulta de CEP via ViaCEP
- Histórico de pedidos por cliente
- Catálogo de produtos: cafés (lote, torra, pontuação SCA), acessórios e combos
- Cálculo de estoque máximo de combos com base nos produtos base
- Criação e gestão de pedidos com baixa automática de estoque
- Devolução de estoque ao cancelar pedidos
- Gestão de funcionários com papéis `ADMIN` e `USER`
- Dashboard com faturamento, lucro estimado, ticket médio e pedidos pendentes
- Gráficos de vendas por período, top produtos, top clientes e mapa por estado
- Relatórios exportáveis em `.xlsx` e `.pdf`

---

## 🛠️ Tecnologias

| Camada | Stack |
|--------|-------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix UI |
| Backend | NestJS 11, TypeScript, Prisma 7 |
| Banco | SQLite (`dev.db`) |
| Auth | JWT + bcrypt + cookie `httpOnly` |
| Relatórios | jsPDF, jspdf-autotable, xlsx |
| Formulários | react-hook-form + zod |

---

## ✅ Pré-requisitos

- Node.js e npm
- Git

> Não é necessário instalar SQLite separadamente — o projeto usa o arquivo `back-cafe/dev.db` incluído no repositório.

---

## 📥 Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/Kazee1/CRM_CAFE.git
cd CRM_CAFE

# 2. Backend
cd back-cafe
npm install
npx prisma generate

# 3. Frontend (em outro terminal)
cd ../front-cafe
npm install
```

---

## 🔐 Variáveis de ambiente

Crie `back-cafe/.env`:

```env
DATABASE_URL=file:./dev.db
JWT_SECRET=<seu_segredo_jwt>
```

> O frontend não usa variáveis de ambiente no estado atual — a URL da API está apontada para `http://localhost:4200`.

---

## ▶️ Como rodar

```bash
# Backend (http://localhost:4200)
cd back-cafe && npm run start:dev

# Frontend (http://localhost:3000)
cd front-cafe && npm run dev
```

### Criar usuário de acesso

Caso não haja credenciais disponíveis no `dev.db`, crie um usuário manualmente:

```bash
curl -X POST http://localhost:4200/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"123456","role":"ADMIN"}'
```

Depois acesse `http://localhost:3000` e faça login.

---

## 🗂️ Estrutura

```
CRM_CAFE/
├── back-cafe/                   # API NestJS + Prisma
│   ├── dev.db                   # Banco SQLite versionado
│   ├── prisma/
│   │   ├── schema.prisma        # Modelos e relacionamentos
│   │   ├── seed.ts              # Seed com simulação anual do negócio
│   │   └── migrations/          # Histórico de migrations
│   └── src/
│       ├── auth/                # Login, cookie JWT, strategy e guards
│       ├── cliente/             # CRUD de clientes
│       ├── produto/             # CRUD de cafés, acessórios e combos
│       ├── pedidos/             # Pedidos com controle de estoque
│       ├── user/                # CRUD de funcionários
│       ├── dashboard/           # KPIs e dados agregados
│       ├── relatorio/           # Endpoints de relatório por período
│       └── main.ts              # Bootstrap na porta 4200
└── front-cafe/                  # Aplicação Next.js
    ├── app/
    │   ├── dashboard/
    │   │   ├── overview/        # KPIs, gráficos e mapa de vendas
    │   │   ├── clientes/        # Gestão de clientes
    │   │   ├── pedidos/         # Gestão de pedidos
    │   │   ├── produtos/        # Gestão de produtos
    │   │   ├── relatorios/      # Exportação de relatórios
    │   │   └── funcionarios/    # Gestão de funcionários (admin)
    │   └── page.tsx             # Tela de login
    ├── lib/                     # Clientes HTTP por domínio
    ├── components/ui/           # Componentes shadcn/Radix
    └── proxy.ts                 # Proteção de rotas
```

---

## 🌐 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/auth/login` | Login e geração de cookie JWT |
| `GET` | `/auth/me` | Dados do usuário autenticado |
| `POST` | `/auth/logout` | Limpa o cookie |
| `GET/POST` | `/users` | Lista / cria funcionário |
| `PUT/DELETE` | `/users/:id` | Atualiza / remove funcionário |
| `GET/POST` | `/clientes` | Lista / cria cliente |
| `PUT/DELETE` | `/clientes/:id` | Atualiza / remove cliente |
| `PATCH` | `/clientes/:id/toggle-status` | Ativa ou inativa cliente |
| `GET/POST` | `/produtos` | Lista / cria produto |
| `PUT/DELETE` | `/produtos/:id` | Atualiza / remove produto |
| `PATCH` | `/produtos/:id/status` | Ativa ou inativa produto |
| `GET/POST` | `/pedidos` | Lista / cria pedido |
| `PUT` | `/pedidos/:id` | Edita pedido pendente |
| `PATCH` | `/pedidos/:id/status` | Atualiza status do pedido |
| `DELETE` | `/pedidos/:id` | Remove pedido e devolve estoque |
| `GET` | `/pedidos/cliente/:id` | Histórico de pedidos do cliente |
| `GET` | `/dashboard/overview` | KPIs e dados do dashboard |
| `GET` | `/relatorio/pedidos?periodo=<dias>` | Relatório de pedidos |
| `GET` | `/relatorio/vendas-por-produto?periodo=<dias>` | Vendas por produto |
| `GET` | `/relatorio/clientes?periodo=<dias>` | Relatório de clientes |
| `GET` | `/relatorio/estoque-periodo?periodo=<dias>` | Estoque e vendas no período |
| `GET` | `/relatorio/cafes-periodo?periodo=<dias>` | Cafés com lote, torra e validade |

---

## 🌱 Seed

O seed simula um ano completo de operação comercial (produtos, clientes e pedidos). **Não cria usuários.**

```bash
cd back-cafe
npx prisma db seed
```

---

## 📄 Licença

`UNLICENSED` — código de uso privado.
