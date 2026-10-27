# FinanceFlow - Handoff Do Projeto

Este arquivo e um guia rapido para retomar o projeto depois de formatar o PC ou trocar de ambiente. Ele resume o estado atual, comandos, deploys, variaveis e proximos passos.

## Estado Atual

FinanceFlow e uma aplicacao full stack de controle financeiro pessoal, feita como projeto de portfolio para demonstrar nivel pleno/senior.

Stack principal:

- Frontend: React, Vite, TypeScript, React Query, Zustand, Recharts e Tailwind.
- Backend: Node.js, Express, TypeScript, TypeORM, PostgreSQL, JWT, bcrypt, Zod e Pino.
- Infra local: Docker Compose com Web, API e PostgreSQL.
- Producao: Vercel para Web, Render para API e Neon para PostgreSQL.
- Testes: Jest/Supertest na API, Vitest/Testing Library no Web e Playwright E2E.

URLs de producao:

- Web: https://financeflow-app-eight.vercel.app
- API: https://financeflow-api-q5ax.onrender.com
- Health check: https://financeflow-api-q5ax.onrender.com/health

Conta demo:

- Email: `demo@financeflow.dev`
- Senha padrao: `FinanceFlow@2026`
- O botao "Entrar como demo" chama `/api/auth/demo-login`.

## Repo

Repositorio GitHub:

```txt
https://github.com/ITZ-Theus/financeflow-app
```

Depois de formatar:

```bash
git clone https://github.com/ITZ-Theus/financeflow-app.git
cd financeflow-app
npm install
```

Se o nome da pasta local for diferente, tudo bem. Os comandos abaixo assumem que voce esta na raiz do repositorio.

## Ultimos Commits Importantes

Sprint 1 (setembro/2026), uma tarefa por PR:

```txt
PR #1  fix(api): validate recurrence dates and prevent runaway loops
PR #2  chore(api): enable TypeScript strict mode
PR #3  refactor(api): extract category and goal services and test the real code
PR #4  test(api): run integration tests against a real PostgreSQL database
PR #5  fix(api): reject transactions that reference another user's category
PR #6  fix(api): return numeric money columns as numbers
T7     fix(api): answer invalid input with 4xx instead of 500   (branch fix/invalid-input-4xx)
T8     docs: Sprint 1 documentation                             (branch docs/sprint-1-docs)
```

O que cada uma resolveu e as historias para entrevista estao em `docs/interview-guide.pt-BR.md`. O que ficou para depois esta em `docs/backlog.md`.

## Variaveis De Ambiente

Nunca commitar `.env` real. Use `.env.example` como base.

### API local

Arquivo recomendado: `apps/api/.env`

```env
PORT=3333
NODE_ENV=development
JWT_SECRET=uma_chave_local_grande
JWT_EXPIRES_IN=7d
WEB_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5433
DB_USER=financeflow
DB_PASS=financeflow123
DB_NAME=financeflow
DB_SSL=false
DB_MIGRATIONS_RUN=true

DEMO_SEED_ON_STARTUP=true
DEMO_USER_EMAIL=demo@financeflow.dev
DEMO_USER_PASSWORD=FinanceFlow@2026
```

### Web local

Arquivo recomendado: `apps/web/.env`

```env
VITE_API_URL=http://localhost:3333/api
VITE_DEMO_EMAIL=demo@financeflow.dev
```

### Render API

Variaveis principais no Render:

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<secret forte>
JWT_EXPIRES_IN=7d
DATABASE_URL=<connection string do Neon>
DB_SSL=true
DB_MIGRATIONS_RUN=true
WEB_URL=https://financeflow-app-eight.vercel.app
DEMO_SEED_ON_STARTUP=true
DEMO_USER_EMAIL=demo@financeflow.dev
DEMO_USER_PASSWORD=FinanceFlow@2026
```

Observacao importante: se `DEMO_SEED_ON_STARTUP` estiver falso, a conta demo existente em producao nao sera recriada com os dados novos.

### Vercel Web

Variaveis principais na Vercel:

```env
VITE_API_URL=https://financeflow-api-q5ax.onrender.com/api
VITE_DEMO_EMAIL=demo@financeflow.dev
```

## Como Rodar Local

Subir tudo via Docker:

```bash
docker compose up -d --build postgres api web
```

URLs locais:

```txt
Web: http://localhost:5173
API: http://localhost:3333
Health: http://localhost:3333/health
Postgres: localhost:5433
```

Rodar seed demo local:

```bash
docker compose exec api npm run seed:demo
```

Parar containers:

```bash
docker compose down
```

Resetar banco local completamente, se precisar:

```bash
docker compose down -v
docker compose up -d --build postgres api web
```

## Testes E Builds

API:

```bash
npm run build:api
npm test          # unit + HTTP, sem banco
npm run test:db   # contra PostgreSQL real (cria e recria o banco financeflow_test)
```

Do host, com o Postgres do Compose na porta 5433:

```bash
DB_PORT=5433 npm run test:db
```

Sem Node no host, rodar dentro dos containers:

```bash
docker compose exec api npm test
docker compose exec api npm run test:db
docker compose exec web npm test
```

Nao interromper o `test:db` no meio: um processo orfao continua usando o `financeflow_test` e atrapalha a proxima execucao (conferir com `docker compose exec api ps`).

Web:

```bash
npm run build:web
npm run test:web
```

E2E:

```bash
docker compose up -d --build postgres api web
npm run test:e2e
```

Quando rodar Playwright em container e abrir o Web por `host.docker.internal`, usar:

```bash
docker run --rm -e E2E_BASE_URL=http://host.docker.internal:5173 -v ${PWD}:/repo -w /repo mcr.microsoft.com/playwright:v1.59.0-noble npx playwright test
```

## Deploy

### Fluxo normal

1. Criar um branch a partir da `main` atualizada (uma tarefa por branch).
2. Commitar, dar `git push -u origin <branch>` e abrir um PR.
3. Esperar o CI ficar verde (Build and Test + API Database Tests).
4. Fazer o merge na `main`.
5. Vercel faz deploy do Web automaticamente.
6. Render faz deploy da API automaticamente se auto deploy estiver ativo. Se nao estiver, usar Manual Deploy.

Se a mudanca alterar o formato de uma resposta da API, subir a API antes do Web (ou os dois juntos).

### Conferir CI

No GitHub:

```txt
Repository > Actions > CI
```

### Conferir Vercel

O deploy do Web precisa estar no commit mais recente da `main`. Se a tela em producao nao mostrar uma mudanca recente, a Vercel nao pegou o ultimo commit ou o navegador esta com cache.

## Diagnostico Rapido De Producao

Testar API health:

```bash
curl https://financeflow-api-q5ax.onrender.com/health
```

Testar login demo:

```bash
curl -X POST https://financeflow-api-q5ax.onrender.com/api/auth/demo-login
```

Categorias antigas indicam seed antigo:

```txt
Housing
Food
Transport
Education
```

Categorias novas indicam seed novo:

```txt
Salario
Moradia
Mercado
Transporte
Saude
Educacao
Lazer
Assinaturas
Investimentos
```

## Arquivos Importantes

Backend:

- `apps/api/src/app.ts`
- `apps/api/src/server.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/config/database.ts`
- `apps/api/src/seeds/demo.ts`
- `apps/api/src/modules/auth`
- `apps/api/src/modules/transactions`
- `apps/api/src/modules/categories`
- `apps/api/src/modules/budgets`
- `apps/api/src/modules/goals`

Frontend:

- `apps/web/src/main.tsx`
- `apps/web/src/services/api.ts`
- `apps/web/src/pages/Dashboard.tsx`
- `apps/web/src/pages/Transactions.tsx`
- `apps/web/src/pages/Categories.tsx`
- `apps/web/src/pages/Budgets.tsx`
- `apps/web/src/pages/Goals.tsx`
- `apps/web/src/index.css`
- `apps/web/src/store/authStore.ts`
- `apps/web/src/store/toastStore.ts`

Docs:

- `README.md`
- `docs/architecture.md`
- `docs/interview-guide.pt-BR.md`
- `docs/project-handoff.pt-BR.md`

## Pontos Ja Resolvidos

- Projeto subiu em producao com Vercel + Render + Neon.
- CI esta configurado no GitHub Actions.
- API usa migrations, JWT, bcrypt, Helmet, rate limit, CORS configurado, request id e logs estruturados.
- API expoe `/version` com versao, ambiente, commit e horario de build quando configurados.
- Frontend tem toast notifications.
- Categoria tem criar, editar e excluir.
- Excluir categoria em uso foi tratado.
- Transacoes tem paginacao, export CSV e recorrencia mensal.
- Dashboard tem resumo mensal, tendencia de 6 meses, insights, gastos por categoria e saude de orcamentos.
- Relatorios tem filtros por periodo, tipo e categoria, tendencia mensal, ranking financeiro e maiores movimentacoes.
- Orcamentos tem alertas derivados para categorias perto ou acima do limite mensal.
- Conta demo tem seed idempotente.
- E2E cobre login demo, categorias, transacoes e orcamentos.

## Pendencias Imediatas

1. Push, PR e merge da T7 (`fix/invalid-input-4xx`).
2. PR da T8 (`docs/sprint-1-docs`), depois do merge da T7: o branch foi criado em cima dela.
3. Apagar os branches ja mergeados (T1 a T6), local e no GitHub.
4. Comecar a Sprint 2 (banco de dados): ver `docs/backlog.md`.

## Proximos Passos

A lista priorizada esta em `docs/backlog.md`. Em resumo:

1. Sprint 2, banco de dados: indices, agregacoes em SQL, N+1 dos orcamentos, transacoes e constraints.
2. Seguranca: onde guardar o token, CORS com `WEB_URL` vazia, TLS do banco.
3. Testes: matriz de isolamento para orcamentos e metas, E2E sem a conta demo compartilhada.
4. Infra: lint, CD condicionado ao CI, imagem Docker de producao mais enxuta.

## Como Explicar Em Entrevista

Pitch curto:

> O FinanceFlow e um app fullstack de controle financeiro pessoal. Eu tratei como produto real: tem autenticacao JWT, API modular, migrations com TypeORM, PostgreSQL, Docker, CI, deploy em Vercel/Render/Neon, conta demo, testes automatizados e documentacao. A parte de dashboard agrega dados financeiros, mostra tendencia mensal, orcamentos e insights para o usuario.

Pontos tecnicos para destacar:

- separacao entre rota HTTP e regra de negocio em service;
- isolamento entre usuarios testado contra PostgreSQL real;
- validacao na borda (entrada invalida nunca vira 500);
- uso de migrations em vez de synchronize;
- escopo por usuario via JWT;
- React Query para server state;
- Docker Compose para ambiente reproduzivel;
- GitHub Actions para CI;
- seed demo para facilitar avaliacao por recrutador;
- deploy real com frontend e backend independentes.

## Depois Da Formatacao

Checklist:

```txt
[ ] Instalar Git
[ ] Instalar Node.js 20+
[ ] Instalar Docker Desktop
[ ] Clonar repo
[ ] Rodar npm install
[ ] Criar apps/api/.env
[ ] Criar apps/web/.env
[ ] Rodar docker compose up -d --build postgres api web
[ ] Abrir http://localhost:5173
[ ] Entrar na conta demo
[ ] Rodar npm run build:api
[ ] Rodar npm run build:web
[ ] Rodar npm test
[ ] Rodar DB_PORT=5433 npm run test:db
[ ] Rodar npm run test:web
```

Se algo quebrar, primeiro conferir:

- `.env`;
- containers do Docker;
- logs da API;
- `VITE_API_URL`;
- `WEB_URL`;
- se as migrations rodaram;
- se o seed demo rodou.
