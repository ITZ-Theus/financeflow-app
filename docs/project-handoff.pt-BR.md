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

Referencias recentes do historico:

```txt
6da9dac fix: replace budget donut with usage meter
d443b08 fix: improve budget usage chart rendering
532fa6c feat: enrich demo account seed data
42a109b test: add budget e2e flow
e9d76a3 fix: allow local cors origins in development
4627ad8 fix: prevent docker internal api url leaking to browser
a2e1cb2 fix: prevent cached authenticated api responses
904b88c test: add transaction e2e flow
dae0de3 feat: add dashboard financial insights
fe6c773 feat: add monthly financial trend
```

O commit `532fa6c` e especialmente importante porque enriquece o seed da conta demo com:

- categorias em PT-BR;
- transacoes do mes atual;
- historico dos ultimos 6 meses;
- orcamentos do mes atual;
- metas realistas;
- uma categoria de orcamento em estado de atencao.

O commit `6da9dac` troca o grafico circular bugado de orcamento por um medidor horizontal.

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
npm test
```

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

1. Fazer commit na `main`.
2. Dar `git push`.
3. CI do GitHub Actions deve ficar verde.
4. Vercel faz deploy do Web automaticamente.
5. Render faz deploy da API automaticamente se auto deploy estiver ativo. Se nao estiver, usar Manual Deploy.

### Conferir CI

No GitHub:

```txt
Repository > Actions > CI
```

### Conferir Vercel

O deploy do Web precisa estar no commit mais recente. Para o grafico novo, conferir se a Vercel pegou:

```txt
6da9dac fix: replace budget donut with usage meter
```

Se em producao ainda aparecer o donut antigo, a Vercel nao esta no ultimo commit ou o navegador esta com cache.

### Conferir Render

No Render:

```txt
financeflow-api > Events
financeflow-api > Logs
```

Para atualizar a conta demo de producao:

1. Confirmar `DEMO_SEED_ON_STARTUP=true`.
2. Rodar `Manual Deploy > Deploy latest commit`.
3. Nos logs, procurar:

```txt
demo account ready
```

Se a dashboard de producao ainda mostrar maio/2026 zerado e categorias antigas em ingles, o seed novo ainda nao rodou no Neon.

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
- Frontend tem toast notifications.
- Categoria tem criar, editar e excluir.
- Excluir categoria em uso foi tratado.
- Transacoes tem paginacao, export CSV e recorrencia mensal.
- Dashboard tem resumo mensal, tendencia de 6 meses, insights, gastos por categoria e saude de orcamentos.
- Conta demo tem seed idempotente.
- E2E cobre login demo, categorias, transacoes e orcamentos.

## Pendencias Imediatas

1. Confirmar se Render API esta com `DEMO_SEED_ON_STARTUP=true`.
2. Rodar redeploy da API no Render para recriar dados demo no Neon.
3. Confirmar se Vercel Web esta no commit `6da9dac` ou mais recente.
4. Validar em producao:
   - conta demo entra;
   - dashboard mostra dados do mes atual;
   - tendencia mostra 6 meses;
   - grafico de orcamento aparece como medidor horizontal;
   - categorias aparecem em PT-BR.

## Proximos Passos De Produto

Sugestoes de roadmap para deixar com ainda mais cara de projeto senior:

1. Adicionar tela de relatorios com filtros por periodo e categoria.
2. Melhorar metas com historico de contribuicoes.
3. Criar alertas de orcamento perto do limite.
4. Adicionar testes E2E para metas.
5. Adicionar Sentry ou ferramenta similar de error tracking.
6. Melhorar observabilidade com endpoint de versao/build.
7. Criar portfolio pessoal e linkar o FinanceFlow como case principal.

## Como Explicar Em Entrevista

Pitch curto:

> O FinanceFlow e um app fullstack de controle financeiro pessoal. Eu tratei como produto real: tem autenticacao JWT, API modular, migrations com TypeORM, PostgreSQL, Docker, CI, deploy em Vercel/Render/Neon, conta demo, testes automatizados e documentacao. A parte de dashboard agrega dados financeiros, mostra tendencia mensal, orcamentos e insights para o usuario.

Pontos tecnicos para destacar:

- separacao entre rota HTTP e regra de negocio em service;
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
