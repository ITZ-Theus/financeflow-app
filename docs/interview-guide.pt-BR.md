# Guia de Entrevista: FinanceFlow

Este guia serve para treinar a explicacao do projeto em entrevista tecnica. A ideia nao e decorar arquivo por arquivo, mas conseguir contar decisoes, tradeoffs e fluxo do sistema com clareza.

## Pitch De 30 Segundos

> O FinanceFlow e uma aplicacao fullstack de controle financeiro pessoal. Eu construi com React, TypeScript, Node, Express e PostgreSQL, usando autenticacao JWT, migrations com TypeORM, Docker, CI no GitHub Actions e deploy separado entre frontend e backend. A ideia foi tratar como um produto real, com dashboard, categorias, metas, conta demo, tratamento de erros, notificacoes, testes automatizados e preocupacoes de seguranca.

## Explicacao De Arquitetura

Use este desenho mental:

```txt
Usuario no navegador
  -> Vercel com React/Vite
  -> Render com API Node/Express
  -> Neon PostgreSQL
```

Boa explicacao:

> Eu separei frontend, backend e banco como camadas independentes. O frontend roda na Vercel porque e uma SPA Vite. A API roda no Render usando Docker. O banco fica no Neon com PostgreSQL. Essa separacao facilita deploy independente, configuracao de ambiente e manutencao.

## Fluxo Para Explicar Login

1. O usuario envia email e senha pela tela de login.
2. O frontend chama `POST /api/auth/login`.
3. A API valida o payload com Zod.
4. O service busca o usuario e compara a senha com bcrypt.
5. A API retorna um JWT.
6. O frontend salva o usuario/token no Zustand.
7. As proximas chamadas usam `Authorization: Bearer <token>`.
8. O middleware da API valida o token nas rotas protegidas.

Frase boa:

> Eu uso JWT para manter a API stateless. A API nao precisa guardar sessao em memoria, e cada request protegido carrega as credenciais no header.

## Fluxo Para Explicar Criacao De Transacao

```txt
Formulario React
  -> hook useTransactions
  -> Axios
  -> route /api/transactions
  -> auth middleware
  -> validacao Zod
  -> TransactionService
  -> TypeORM
  -> PostgreSQL
  -> React Query atualiza a UI
```

Frase boa:

> Eu deixei as regras de negocio no service, nao dentro da rota. A rota fica como adaptador HTTP, e o service concentra validacoes de dominio e persistencia.

## Pontos Fortes Para Citar

- Projeto fullstack com deploy real.
- API modular por dominio.
- Autenticacao JWT com middleware.
- Senhas com hash bcrypt.
- Validacao com Zod.
- Erros centralizados com `AppError` e `errorHandler`.
- Migrations versionadas com TypeORM.
- Docker Compose para ambiente local.
- CI rodando build e testes.
- Testes unitarios e de integracao na API.
- Testes de frontend com Vitest e Testing Library.
- Teste E2E com Playwright cobrindo login demo e gerenciamento de categoria.
- Rate limit no auth, Helmet, CORS configurado, request id e logs estruturados.
- Conta demo para recrutador testar rapidamente.

## Perguntas Que Podem Aparecer

### Por que PostgreSQL?

> Porque o dominio e relacional: usuarios, categorias, transacoes e metas possuem relacionamentos claros. PostgreSQL tambem e robusto, muito usado em producao e combina bem com migrations.

### Por que TypeORM?

> Porque ele integra bem com TypeScript, entidades e migrations. Para este projeto, eu queria produtividade sem abrir mao de versionar o schema do banco.

### Por que migrations em vez de synchronize?

> Porque `synchronize` pode alterar schema automaticamente e causar risco em producao. Migrations deixam as alteracoes explicitas, revisaveis e reproduziveis.

### Por que React Query?

> Porque os dados principais vem da API. React Query simplifica loading, cache, refetch e invalidacao depois de mutations como criar, editar ou deletar.

### Por que Zustand?

> Porque eu precisava de um estado global pequeno e simples para autenticacao e notificacoes. Zustand e leve e evita boilerplate.

### Como voce protege dados de um usuario?

> As rotas protegidas extraem o `userId` do JWT, e as consultas filtram pelo usuario autenticado. Assim um usuario nao consegue listar, editar ou excluir dados de outro.

### Como voce debuga erro em producao?

> Cada resposta tem `X-Request-Id`. Se o frontend mostra erro, eu consigo pegar esse id e procurar o log correspondente na API. Os requests sao logados em JSON com metodo, rota, status, duracao e request id. Erros inesperados tambem sao logados com mensagem e stack.

### Como funciona CORS no projeto?

> A API aceita a origem configurada em `WEB_URL`. Em producao esse valor aponta para a URL da Vercel. Isso evita liberar qualquer origem por padrao.

### O que voce melhoraria?

> Eu expandiria os testes E2E para cobrir transacoes e metas, alem do fluxo atual de login demo e categorias. Tambem colocaria logs estruturados, Sentry, exportacao CSV, transacoes recorrentes e orcamento por categoria.

## Como Fazer Uma Demo Em 5 Minutos

1. Abra o projeto em producao.
2. Entre com a conta demo.
3. Mostre o dashboard e explique entradas, saidas, saldo e graficos.
4. Crie uma categoria.
5. Crie uma transacao usando essa categoria.
6. Mostre o toast de feedback.
7. Volte para o dashboard e mostre os numeros atualizados.
8. Abra rapidamente o GitHub Actions e mostre o CI.
9. Mostre o README e a documentacao de arquitetura.

## Como Explicar Que O Projeto Tem Nivel Profissional

Use esta estrutura:

> Eu nao pensei nele apenas como CRUD. Eu coloquei preocupacoes que existem em produto real: deploy separado, variaveis de ambiente, CORS, autenticacao, rate limit, migrations, seed demo, testes, CI, feedback visual e documentacao. Ainda ha melhorias possiveis, mas a base ja mostra capacidade de construir, publicar, testar e evoluir uma aplicacao fullstack.

## Checklist De Estudo

- [ ] Explicar a arquitetura sem olhar o codigo.
- [ ] Explicar login de ponta a ponta.
- [ ] Explicar criacao de transacao de ponta a ponta.
- [ ] Explicar por que existe service separado da rota.
- [ ] Explicar migrations.
- [ ] Explicar CORS e variaveis de ambiente.
- [ ] Explicar CI.
- [ ] Explicar testes da API.
- [ ] Explicar testes do frontend.
- [ ] Falar 3 melhorias futuras com tradeoffs.
