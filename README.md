# FinanceFlow

Aplicacao full stack para controle financeiro pessoal, com autenticacao, categorias, transacoes, resumo mensal e metas financeiras.

## Stack

- API: Node.js, Express, TypeScript, TypeORM, MySQL, Zod e JWT
- Web: React, Vite, TypeScript, React Query, Zustand, Tailwind CSS e Recharts
- Infra local: Docker Compose com MySQL, API e Web

## Como rodar com Docker

```bash
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3333
- Health check: http://localhost:3333/health
- MySQL no host: localhost:3307

## Como rodar localmente

1. Instale as dependencias:

```bash
npm install
```

2. Suba o MySQL:

```bash
docker compose up mysql
```

3. Configure os arquivos `.env` em `apps/api` e `apps/web` usando `.env.example` como referencia.

4. Rode API e Web em terminais separados:

```bash
npm run dev:api
npm run dev:web
```

## Scripts

```bash
npm run build:api
npm run build:web
npm test
```
