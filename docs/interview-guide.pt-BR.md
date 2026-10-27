# Guia de Entrevista: FinanceFlow

Este guia serve para treinar a explicacao do projeto em entrevista tecnica. A ideia nao e decorar arquivo por arquivo, mas conseguir contar decisoes, tradeoffs e fluxo do sistema com clareza.

## Pitch De 30 Segundos

> O FinanceFlow e uma aplicacao fullstack de controle financeiro pessoal. Eu construi com React, TypeScript, Node, Express e PostgreSQL, usando autenticacao JWT, migrations com TypeORM, Docker, CI no GitHub Actions e deploy separado entre frontend e backend. A ideia foi tratar como um produto real, com dashboard, categorias, orcamentos por categoria, metas, conta demo, tratamento de erros, notificacoes, testes automatizados e preocupacoes de seguranca.

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

> O token e JWT, entao a API nao guarda sessao em memoria e cada request carrega as credenciais no header. Mas o middleware ainda faz uma consulta por request para confirmar que o usuario existe: e um tradeoff consciente, porque assim o token de um usuario apagado para de funcionar na hora. O que ainda falta e revogacao e um tempo de vida menor (hoje sao 7 dias, guardado no localStorage).

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
- TypeScript em modo strict na API e no Web.
- Testes unitarios, de HTTP e contra PostgreSQL real na API, incluindo uma matriz de isolamento entre dois usuarios.
- Validacao na borda: entrada invalida recebe 4xx, nunca 500.
- Testes de frontend com Vitest e Testing Library.
- Teste E2E com Playwright cobrindo login demo, categoria, ciclo de transacao e orcamentos.
- Orcamentos mensais por categoria com calculo de uso, restante e status.
- Alertas de orcamento para categorias perto ou acima do limite mensal.
- Transacoes recorrentes mensais com geracao automatica e validacao de data final.
- Tendencia mensal de entradas, saidas e saldo calculada pela API e exibida na dashboard.
- Relatorios financeiros com filtros por periodo, tipo e categoria.
- Cards de insight para taxa de economia, direcao dos gastos e maior categoria de despesa.
- Rate limit no auth, Helmet, CORS configurado, request id e logs estruturados.
- Endpoint publico de versao/build para conferir ambiente e commit em producao.
- Conta demo para recrutador testar rapidamente.

## Perguntas Que Podem Aparecer

### Por que PostgreSQL?

> Porque o dominio e relacional: usuarios, categorias, transacoes, orcamentos e metas possuem relacionamentos claros. PostgreSQL tambem e robusto, muito usado em producao e combina bem com migrations.

### Por que TypeORM?

> Porque ele integra bem com TypeScript, entidades e migrations. Para este projeto, eu queria produtividade sem abrir mao de versionar o schema do banco.

### Por que migrations em vez de synchronize?

> Porque `synchronize` pode alterar schema automaticamente e causar risco em producao. Migrations deixam as alteracoes explicitas, revisaveis e reproduziveis.

### Por que React Query?

> Porque os dados principais vem da API. React Query simplifica loading, cache, refetch e invalidacao depois de mutations como criar, editar ou deletar.

### Por que Zustand?

> Porque eu precisava de um estado global pequeno e simples para autenticacao e notificacoes. Zustand e leve e evita boilerplate.

### Como voce protege dados de um usuario?

> As rotas protegidas extraem o `userId` do JWT e toda consulta filtra pelo usuario autenticado. Recurso de outro usuario responde 404, e nao 403, para nao revelar que o id existe. Mas filtrar as consultas nao basta: eu encontrei um caso em que a transacao aceitava o `categoryId` de outro usuario, porque a FK so verifica se a categoria existe. Hoje o service confere o dono da categoria referenciada, e uma suite contra PostgreSQL real testa o isolamento entre dois usuarios nos dois sentidos.

### Como voce debuga erro em producao?

> Cada resposta tem `X-Request-Id`. Se o frontend mostra erro, eu consigo pegar esse id e procurar o log correspondente na API. Os requests sao logados em JSON com metodo, rota, status, duracao e request id. Erros inesperados tambem sao logados com mensagem e stack.

### Como funciona a tendencia mensal?

> A API busca as transacoes do usuario em uma janela de ate 12 meses e agrega entradas, saidas e saldo por mes. Hoje essa soma e feita em JavaScript, depois de carregar as linhas. Funciona no volume atual, mas o proximo passo e fazer a agregacao no SQL com `SUM ... GROUP BY` e criar um indice em `(userId, date)`, medindo antes e depois com `EXPLAIN ANALYZE`.

### Como funciona CORS no projeto?

> A API aceita a origem configurada em `WEB_URL`, que em producao aponta para a URL da Vercel. Tem um ponto fraco que eu conheco: se `WEB_URL` estiver vazia em producao, a API libera qualquer origem. O impacto e limitado porque o token vai no header e nao em cookie, mas o certo e a API se recusar a subir sem essa variavel, e isso esta no backlog.

### O que voce melhoraria?

> A proxima etapa e banco de dados: hoje os resumos e relatorios carregam as linhas e somam em JavaScript, o calculo de orcamento faz uma consulta por orcamento (N+1) e as consultas principais nao tem indice. Eu faria a agregacao no SQL, criaria os indices e mediria com `EXPLAIN ANALYZE`. Depois, decidir onde o token fica: cookie httpOnly com token curto ou bearer com tempo de vida menor e CSP. A lista completa esta em `docs/backlog.md`.

## Bugs Reais Que Eu Encontrei E Corrigi (Sprint 1)

Use estas historias quando perguntarem de um bug dificil, de seguranca ou de testes. Cada uma tem sintoma, causa, correcao e como eu provei.

### Uma requisicao travava a API inteira

- **Sintoma:** `POST /transactions` com `recurrenceEndDate: "abc"` demorava 9,5 s, e o `/health` tambem ficava parado durante esse tempo.
- **Causa:** a validacao comparava as datas como texto. `"abc" < "2026-01-01"` e falso, entao a data invalida passava, e o calculo de ocorrencias avancava mes a mes num laco sincrono ate o ano 275760. Como o Node tem uma thread so, todas as outras requisicoes esperavam.
- **Correcao:** validacao de data real na borda (zod), checagem defensiva no service e o numero de meses calculado por formula, sem laco. Comparei a formula nova com a antiga em 492 mil pares de datas para garantir que o comportamento nao mudou.
- **Licao:** em Node, um laco sincrono sem limite e uma negacao de servico. E a conta demo publica deixava qualquer visitante fazer isso.

### Um usuario conseguia ver a categoria de outro (BOLA)

- **Sintoma:** criar uma transacao com o `categoryId` de outro usuario funcionava, e a listagem devolvia nome, cor e dono da categoria alheia.
- **Causa:** a FK so garante que a categoria existe, nao de quem ela e. As consultas eram filtradas por usuario, mas a referencia entre recursos nao.
- **Correcao:** o service confere o dono e o tipo da categoria antes de gravar.
- **Prova:** escrevi primeiro uma matriz com dois usuarios contra PostgreSQL real. Dos 24 casos, so os de referencia falharam (6, nos dois sentidos), o que confirmou o bug exato. Depois da correcao, passaram todos.

### Meta concluida sozinha por causa de string

- **Sintoma:** editar so o titulo de uma meta a 3.850 de 12.000 marcava ela como concluida.
- **Causa:** o driver do PostgreSQL devolve `numeric` como string, e `"3850.00" >= "12000.00"` e verdadeiro como texto. O tipo dizia `number`, mas era mentira em runtime.
- **Correcao:** um transformer na coluna converte para numero na leitura. A decisao e os limites estao no ADR 0001.
- **Licao:** o teste unitario dessa regra passava porque o mock usava numeros. So o teste contra o banco real reproduziu o bug.

### Ligar o strict quebrou a API sem quebrar nenhum teste

- **Sintoma:** com `strict: true`, o build passava e os 156 testes passavam, mas a API nao subia.
- **Causa:** com `strictNullChecks`, o TypeScript grava `string | null` nos metadados como `Object`, e o TypeORM usa esses metadados para descobrir o tipo das colunas sem tipo declarado.
- **Correcao:** declarar o tipo explicito nessas quatro colunas, igual ao do banco.
- **Licao:** foi o melhor argumento para ter testes contra PostgreSQL real. Testei depois: com o bug de volta, os testes com mock passam e a suite com banco falha na hora.

### Testes que testavam uma copia do codigo

- **Sintoma:** os testes de categoria e meta passavam, mas o codigo de producao tinha um bug que o teste nao pegava.
- **Causa:** o arquivo de teste declarava a propria versao dos services, e essa copia tinha uma correcao que o codigo real nao tinha.
- **Correcao:** extrair os services para arquivos proprios e testar o codigo real. Para provar que os testes novos exercitam a producao, quebrei o codigo de proposito e conferi que algum teste falhava.

### Toda entrada invalida virava 500

- **Sintoma:** 17 de 17 requisicoes malformadas (id que nao e UUID, data impossivel, JSON quebrado, `limit=-5`) respondiam 500.
- **Correcao:** validacao com zod do corpo, da query e do `:id`, mais um mapeamento de erros no `errorHandler`. As regras de status estao no ADR 0002 (por exemplo, 404 e nao 403 para dado de outro usuario).
- **Prova:** uma tabela de testes contra o banco real com essas requisicoes, que falhava antes e passa depois.

## Como Fazer Uma Demo Em 5 Minutos

1. Abra o projeto em producao.
2. Entre com a conta demo.
3. Mostre o dashboard e explique entradas, saidas, saldo e graficos.
4. Explique o grafico de tendencia dos ultimos meses.
5. Crie uma categoria.
6. Crie uma transacao usando essa categoria.
7. Mostre o toast de feedback.
8. Abra a tela de orcamentos e mostre o limite, gasto, restante e status por categoria.
9. Volte para o dashboard e mostre os numeros atualizados.
10. Abra rapidamente o GitHub Actions e mostre o CI.
11. Mostre o README e a documentacao de arquitetura.

## Como Explicar Que O Projeto Tem Nivel Profissional

Use esta estrutura:

> Eu nao pensei nele apenas como CRUD. Eu coloquei preocupacoes que existem em produto real: deploy separado, variaveis de ambiente, CORS, autenticacao, rate limit, migrations, seed demo, testes, CI, feedback visual e documentacao. Ainda ha melhorias possiveis, mas a base ja mostra capacidade de construir, publicar, testar e evoluir uma aplicacao fullstack.

## Checklist De Estudo

- [ ] Explicar a arquitetura sem olhar o codigo.
- [ ] Explicar login de ponta a ponta.
- [ ] Explicar criacao de transacao de ponta a ponta.
- [ ] Explicar como o orcamento por categoria e calculado.
- [ ] Explicar por que existe service separado da rota.
- [ ] Explicar migrations.
- [ ] Explicar CORS e variaveis de ambiente.
- [ ] Explicar CI.
- [ ] Explicar testes da API: o que cada camada prova (unit, HTTP, PostgreSQL) e por que os mocks nao bastavam.
- [ ] Contar pelo menos duas historias da secao de bugs reais sem olhar.
- [ ] Explicar testes do frontend.
- [ ] Falar 3 melhorias futuras com tradeoffs.
