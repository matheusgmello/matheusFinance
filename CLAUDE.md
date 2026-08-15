# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Convenções de Trabalho

- **Commits:** nunca adicionar `Co-Authored-By` nas mensagens de commit
- **Comentários no código:** apenas quando o PORQUÊ for não óbvio; nunca descrever O QUE o código faz
- **Sem features extras:** não adicionar abstrações, error handling ou validações além do que foi pedido
- **Sem emojis** nas respostas ou arquivos, a menos que explicitamente pedido

---

## Project Overview

**matheusFinance** é uma aplicação web de controle financeiro pessoal, de uso individual. O objetivo é substituir a planilha de gastos: **gestão de cartões, faturas, compras parceladas, pagamentos recorrentes, orçamento e relatórios**.

- **Backend:** Spring Boot 4.0.5 + Java 21 (Zulu JDK) + PostgreSQL
- **Frontend:** React 18 + Vite + Tailwind CSS + TanStack Query + Recharts
- **Infra:** Docker Compose (PostgreSQL exposto na porta **5435** — porta local 5432 está ocupada por instância local)

### Fora de escopo (decisão consciente)

**IR/DARF e acompanhamento de carteira foram removidos do projeto.** O ReVar (B3 + Receita Federal) faz apuração de renda variável de graça, e Status Invest / Investidor10 consolidam carteira melhor. Não reintroduzir sem uma razão nova — o código está no histórico do git.

O foco é a **entrada de dados sem digitação**: import de fatura (CSV ou PDF, dependendo do banco). Digitação manual foi o que fez o projeto ser abandonado antes.

---

## Ambiente Local

### Subir o projeto

```bash
# Postgres (necessário pro backend rodar)
docker compose up postgres -d

# Backend — JDK obrigatório: Zulu 21
cd backend
mvn compile
mvn spring-boot:run    # requer postgres container rodando
mvn package -DskipTests

# Frontend
cd frontend
npm install
npm run dev      # Vite dev server em localhost:5173 (expõe na rede local via host: true)
npm run build    # tsc + vite build
npx tsc --noEmit # typecheck isolado
```

Scripts `.bat`/`.sh` foram removidos — sobe cada peça manualmente como acima.

### Configuração

| Config | Valor |
|--------|-------|
| PostgreSQL host | `localhost:5435` (Docker) — evita conflito com instância local na 5432 |
| Backend | `http://localhost:8085` |
| Frontend dev | `http://localhost:5173` (Vite `host: true`, já expõe na rede local sem flag extra) |
| JDK | Zulu 21 |

IntelliJ: SDK apontando pra Zulu 21, Annotation Processing habilitado (Lombok).

---

## Arquitetura do Backend

```
com.matheusfinance/
├── core/
│   ├── security/          # JwtAuthFilter, JwtUtil
│   └── api/exception/     # GlobalExceptionHandler + exceções HTTP
├── infra/
│   ├── config/            # SecurityConfig, AppProperties, SchedulingConfig
│   └── persistence/       # BackupService (backup JSON diário)
└── features/              # cada feature isolada, package-by-feature
    ├── auth/              # e-mail + senha + JWT
    ├── perfil/            # perfis, export/import, limpar dados
    ├── cartao/
    ├── compra/            # compras parceladas, parcelas, fatura + import (Nubank/Itaú), ParcelamentoCalculator
    ├── recorrente/        # pagamentos fixos mensais + checklist
    ├── categoria/
    ├── orcamento/
    ├── receita/
    ├── alerta/            # vencimentos de parcelas e recorrentes
    ├── meta/              # metas de economia com aportes
    ├── dashboard/         # agregações
    ├── relatorio/         # export CSV
    └── push/              # Web Push (VAPID)
```

### Segurança e Autenticação

E-mail + senha + JWT. BCrypt para hash.

1. `POST /api/auth/register` — cria usuário + perfil, retorna JWT
2. `POST /api/auth/login` — valida credenciais, retorna JWT
3. `POST /api/auth/switch-profile?perfilId=X` — troca de perfil

JWT carrega dois claims: `perfilId` (perfil ativo) e `usuarioId` (dono dos perfis).

`JwtAuthFilter` valida Bearer token e, fora de `/api/auth/`, exige que `X-Perfil-Id` bata com o claim do JWT.

Rotas públicas: `/api/auth/**`, `/actuator/**`. Todo o resto exige autenticação.

| Header | Propósito |
|--------|-----------|
| `Authorization: Bearer <token>` | Autenticação JWT |
| `X-Perfil-Id` | Multi-tenancy lógico — validado contra o claim do JWT |

**Nunca remova o filtro por perfil nos repositórios** (`findByIdAndPerfilId`, `findAllByPerfilId`). É o único mecanismo de isolamento entre perfis.

Multi-perfil é mantido deliberadamente mesmo com um único usuário: `perfilId` aparece em ~630 lugares e 15 migrations. Arrancar custa muito e não rende nada.

### Regra de Negócio: Parcelamento

`ParcelamentoCalculator` em `compra/`:
- Se `diaCompra >= diaFechamento` do cartão → 1ª parcela vence **dois meses à frente**
- Caso contrário → 1ª parcela vence **no próximo mês**
- Ajuste automático para meses com menos dias

### Import de Fatura

`POST /api/fatura/importar?cartaoId=X&ano=Y&mes=Z&banco=nubank|itau` (multipart, campo `arquivo`). **`banco` é obrigatório e decide o parser** — extensão de arquivo sozinha não basta desde que o Nubank passou a ter fatura em CSV *e* em PDF: um `.pdf` pode ser de qualquer um dos dois bancos. `banco=itau` exige `.pdf` (só formato que existe); `banco=nubank` aceita `.csv` (`NubankFaturaParser`) ou `.pdf` (`NubankFaturaPdfParser`). Resposta é sempre `List<FaturaImportDTO.Resultado>` (um elemento por mês afetado — CSV sempre 1, PDF do Itaú sempre 2, PDF do Nubank sempre 1, ver abaixo).

**Nubank — CSV.** Colunas `date,title,amount`, valor com vírgula decimal entre aspas, negativo (`"- 123,45"`) para pagamento/estorno — essas linhas são descartadas no parser, só valor positivo vira lançamento.

**Nubank — PDF (fatura fechada).** Formato de linha bem diferente do CSV: data "DD MMM" abreviada em português (sem ano), valor sempre prefixado com "R$", marcador de cartão opcional (`•••• 6150`) entre data e estabelecimento que o parser descarta — o sistema só rastreia o cartão escolhido no upload, não sub-conta por cartão adicional. Diferente do Itaú, a tabela `TRANSAÇÕES DE ... A ...` não colide com nenhuma outra linha do documento — basta casar o prefixo de data, sem precisar de marcador de início/fim de seção. **Não cobre compra parcelada nem prévia de próxima fatura**: o PDF de exemplo usado pra construir o parser não tinha parcela ativa naquele mês (então não há como confirmar como o Nubank mostraria isso no PDF — o CSV mostra como texto livre no título, mas o layout da tabela do PDF é outra coisa, não dá pra assumir igual), e a seção "PRÓXIMAS FATURAS" do PDF só tem agregado (saldo em aberto), não uma tabela de linhas como a do Itaú — não tem o que importar pro mês seguinte.

**Itaú — PDF, não CSV.** Extração de texto via PDFBox com `sortByPosition(false)` — **não** `true`. A fatura tem colunas lado a lado na mesma página (tabela de lançamentos + caixa de "encargos"); ordenar por posição visual mistura as duas numa linha só (visto com arquivo real: um fragmento de "período (10/08 a 09/09)" vazou pra dentro de uma linha de transação). Sem ordenar, o texto sai na ordem do content stream, que preserva as linhas da tabela corretas.

`FaturaPdfUtil` (package-private) compartilha entre os dois parsers de PDF a extração de texto via PDFBox e a resolução de ano (dia/mês sem ano → ano anterior se o mês da transação for posterior ao mês de referência). Extraído depois que o quality gate acusou duplicação real entre `ItauFaturaPdfParser` e `NubankFaturaPdfParser` — não é abstração especulativa, o gate mediu o código duplicado de verdade.

Cada transação ocupa duas linhas no texto extraído — `DATA ESTABELECIMENTO [PARCELA] VALOR` seguida de `categoria  cidade` (ignorada, `LinhaFatura` não usa esses campos). O PDF só dá dia/mês, sem ano — resolvido contra o `ano`/`mes` que o usuário informa na URL: se o mês da transação é posterior ao mês de referência, é do ano anterior (parcela final de compra longa; nada é lançado no futuro numa fatura fechada). Não cobre virada de ano com mais de 12 meses de folga — sem exemplo real desse caso pra confirmar o comportamento certo.

A fatura do Itaú tem duas tabelas com a mesma forma de linha: "Lançamentos: compras e saques" (gasto deste mês) e "Compras parceladas - próximas faturas" (prévia do mês seguinte, valor já comprometido pelo próprio banco — não é inferência nossa). O parser separa as duas em listas distintas; o controller chama `FaturaImportService.importar()` duas vezes, uma pro mês atual e outra pro mês seguinte. Quando a fatura real do mês seguinte for importada (CSV ou PDF), a idempotência por `(cartão, mês)` sobrescreve a prévia automaticamente.

**Idempotência é por fatura, não por transação:** a unidade de import é `(cartão, mês de referência)`. Reimportar substitui o conteúdo daquele mês inteiro. Isso evita dedup frágil por hash de `data + valor + descrição`, que descartaria compras legitimamente idênticas.

`CompraParcelada.faturaMesReferencia` (V24, nullable) marca qual fatura originou a compra — `NULL` em compras criadas manualmente. É essa coluna, não a data de vencimento, que decide o que uma reimportação apaga; evita que reimportar um mês destrua uma compra parcelada manual que caia por coincidência no mesmo cartão/mês.

Cada linha importada vira uma `CompraParcelada` com `numParcelas=1` — sem passar pelo `ParcelamentoCalculator`, já que o mês da fatura é dado pelo usuário, não calculado. Se a fatura já mostra parcela no texto (parcelamento feito por outro emissor, ex: parcelamento da loja), isso é preservado literal (Nubank) ou formatado como "- Parcela N/M" (Itaú, que mostra o número separado) na descrição, sem tentar linkar com as outras parcelas — o sistema não tem visibilidade da compra original, só do que apareceu nesta fatura.

O modelo de transação deve permanecer **agnóstico de formato** — cada parser converte pra `LinhaFatura` na fronteira, o domínio não sabe a origem. Em todo parser de PDF, `parseTexto(String, YearMonth)` é separado de `parse(InputStream, YearMonth)` justamente pra isso: a gramática de linha é testável com texto literal, sem precisar de um PDF de verdade no teste.

**Categorização é aprendida do histórico, não digitada de novo.** `FaturaImportService.aprenderCategorias()` monta um mapa `estabelecimento → última categoria usada` a partir de todas as compras já categorizadas do perfil (manuais ou importadas); toda linha nova busca nesse mapa pela mesma chave antes de criar a compra. Chave normalizada — `chaveEstabelecimento()` remove o sufixo `- Parcela N/M` e ignora maiúscula/minúscula, senão "AMAZON BRSAO P - Parcela 01/02" e "...- Parcela 02/02" nunca bateriam como o mesmo estabelecimento. Quando há mais de uma categoria histórica pro mesmo estabelecimento, vence a mais recente por `dataCompra`.

**O mapa é montado antes de apagar as compras existentes do mês, não depois.** Reimportar um mês já categorizado (ex: banco corrigiu uma linha na fatura) precisa que a categoria dada àquele mês sobreviva pro reimport — se o `deleteAll` rodasse antes do aprendizado, a categorização mais recente do usuário seria perdida antes de poder ser reaproveitada. `FaturaImportServiceTest#reimportarMesmoMesPreservaCategoriaJaDada` existe pra pegar regressão nessa ordem especificamente (confirmado por mutação: invertendo a ordem, o teste falha).

`pdfbox` (3.0.2) e `commons-csv` já estavam no `pom.xml`, sobra do parser de investimentos deletado — reaproveitados aqui, zero dependência nova.

### Export / Import e Backup

`PerfilExportImportService` serializa perfil em JSON. `BackupService` grava backup diário por perfil em `./backups`, retenção 30 dias.

**`BackupService` usa o `ObjectMapper` (Jackson 3, `tools.jackson.databind`) injetado pelo Spring, não uma instância própria.** Uma instância própria com Jackson 2 (`com.fasterxml.jackson.databind`) já causou uma falha silenciosa real: sem `jackson-datatype-jsr310` no classpath, `OffsetDateTime` não serializa, a exceção era capturada e logada por perfil, e o job terminava com "Backup automático concluído" mesmo com todo backup do dia corrompido. `BackupServiceTest` existe para pegar essa classe de regressão de novo.

Cobre cartões, compras com parcelas, recorrentes com checklist, categorias, orçamentos, receitas e metas. Coberto por `PerfilExportImportServiceTest`.

**Ao adicionar uma entidade nova por perfil, ela precisa entrar no backup** — em `PerfilBackupDTO.Backup`, no export e no import. O teste de round-trip falha se você esquecer, desde que uma asserção seja adicionada junto.

Formato na versão `"2"`. Backups na `"1"` não têm categorias, orçamentos, receitas e metas; o import trata esses campos nulos como lista vazia.

### Schema e Migrations

Flyway é a única fonte de verdade — `ddl-auto: none`, `validate-on-migrate: true`.

**Migrations nunca são deletadas.** Apagar arquivo de `db/migration/` quebra o boot por checksum. V1–V24 permanecem, incluindo as de tabelas hoje órfãs (investimentos, operações, proventos, patrimônio, alertas de preço, rebalanceamento). Dropar essas tabelas é decisão separada, adiada.

**Próxima migration disponível: V25**

Em Spring Boot 4 o autoconfigure do Flyway está em `spring-boot-starter-flyway`, separado de `flyway-core`. Ambos são necessários no `pom.xml`.

---

## Testes e Qualidade

### Testes

```bash
docker compose up postgres -d
docker exec matheusfinance-db createdb -U finance_user matheusfinance_test   # uma vez só
mvn test
```

Os testes de integração usam **PostgreSQL real** em `localhost:5435`, banco `matheusfinance_test` — o mesmo arranjo que o `.github/workflows/ci.yml` já provisiona. `application-test.yml` aceita override por `SPRING_DATASOURCE_URL`.

**Testcontainers foi removido.** O `docker-java` embutido negocia a API 1.32 e o Docker 29+ recusa (`client version 1.32 is too old`), sem override que funcione via `DOCKER_API_VERSION` ou `api.version`.

Cobertura atual:
- `ParcelamentoCalculatorTest` — regra de fechamento, meses curtos, ano bissexto, virada de ano
- `PerfilExportImportServiceTest` — round-trip export/import de todas as entidades + compatibilidade com backup versão "1"
- `BackupServiceTest` — dispara o backup agendado, lê o JSON gravado em disco e restaura via `PerfilExportImportService`, fechando o ciclo que `PerfilExportImportServiceTest` sozinho não cobre
- `NubankFaturaParserTest`, `ItauFaturaPdfParserTest` — gramática de cada formato, com texto/CSV literal no teste (nunca o arquivo real do usuário)
- `FaturaImportServiceTest` — idempotência por `(cartão, mês)`, e que reimportar não apaga compra manual coincidente

Ao escrever testes de integração: `@AutoConfigureMockMvc` foi removido no Spring Boot 4, e RestAssured 5.5.0 lança NPE no Java 21 via Groovy (as duas dependências foram removidas do `pom.xml`). Usar `RestTemplate` com `@LocalServerPort`.

### Quality Gate

Ratchet de métricas (skill `quality-gate-lite` de [matheusgmello/skills](https://github.com/matheusgmello/skills)): uma PR pode adicionar código, mas nunca pode piorar uma métrica. `backend/quality-gate.mjs` e `frontend/quality-gate.mjs` são cópias idênticas do mesmo script zero-dependência; cada lado tem seu próprio `qualitygate.config.json` e `baseline.json` — são dois projetos com stacks diferentes, não faz sentido um gate só.

```bash
# backend
cd backend && mvn test jacoco:report && node quality-gate.mjs collect && node quality-gate.mjs check

# frontend
cd frontend && npm audit --json > reports/npm-audit.json; node quality-gate.mjs collect && node quality-gate.mjs check
```

`collect` escreve `metrics.json` (gerado, não versionado); `check` compara com `baseline.json` (versionado) e sai com código 1 se alguma métrica piorou; `update` avança o baseline — só roda em push pra `main`, nunca numa PR.

**Métricas ligadas hoje refletem a infra que existe de verdade, não a lista completa da skill:**

| | Backend | Frontend |
|---|---|---|
| `coverage` | JaCoCo (`target/site/jacoco/jacoco.csv`) | — sem test framework, não ligado |
| `duplication` | jscpd (built-in no script) | jscpd |
| `largeFiles` | > 300 linhas (built-in) | > 300 linhas |
| `lint` | — sem Checkstyle configurado | — `eslint` não está instalado (`npm run lint` no `package.json` é vestigial, falha com "eslint: not found") |
| `security` | — a skill só sabe ler `npm audit`, não tem receita para Maven | `npm audit --json` |

`lint`/`complexity`/`security` do lado backend e `lint`/`coverage` do lado frontend ficam de fora até a infra que alimenta cada um existir de verdade — ligar a métrica sem o relatório por trás só ia gerar `null` permanente. Instalar Checkstyle, Pitest ou ESLint só para alimentar o gate não estava no escopo desta mudança; ESLint em particular cruza com a issue #1 (redesign do frontend).

**Não é a versão `quality-gate` (full).** Essa soma `complexity` (exige regra de complexidade ciclomática no lint), `dependencies` (ciclos circulares via `madge`, só enxerga JS/TS — sempre `null` no backend, que é onde mora a complexidade real hoje) e `mutation` (Pitest/Stryker, e a própria doc da skill diz pra só ligar quando a suíte de testes estiver sólida — a daqui tem poucos dias). Config é compatível: subir de lite pra full depois é só adicionar essas três à lista `metrics`, o `baseline.json` continua valendo.

`.github/workflows/ci.yml` roda `collect` + `check` em cada job depois dos testes/build, publica o resumo no `$GITHUB_STEP_SUMMARY`, e `update` só no push pra `main`.

### CI / Branch Protection

`main` exige os dois jobs do `ci.yml` (`Backend Tests (Java 21)`, `Frontend Build (Node 20)`) verdes pra liberar merge — inclui o quality gate, que roda dentro desses jobs. `enforce_admins` ligado, sem exceção pro dono do repo. Auto-merge ligado no repo: PR mescla sozinho no instante em que os checks passam, sem clique.

---

## Arquitetura do Frontend

```
frontend/src/
├── core/          # api/axios.ts, types, hooks
├── shared/        # context (Auth, Profile, Theme), components (ui, layout)
├── domains/       # api por domínio: auth, cartao, compra, recorrente, dashboard, alertas, meta, configuracao
└── pages/         # auth, dashboard, cartoes, compras, recorrentes, metas, calculadoras, configuracoes, perfis
```

### Fluxo de Estado

```
ThemeProvider   → themeKey (10 temas) → localStorage 'appTheme' → class 'theme-{key}' (+ 'dark') no <html>
AuthContext     → token + perfilId + perfilNome → localStorage 'mf_auth'
ProfileContext  → activeProfile → localStorage 'activeProfile'
setupAxiosInterceptors(perfilId, token) → injeta Authorization + X-Perfil-Id
```

Interceptor redireciona para `/login` em 401 ou 403.

### Rotas

| Rota | Arquivo |
|------|---------|
| `/login`, `/register` | `pages/auth/` |
| `/` | `pages/dashboard/DashboardPage.tsx` |
| `/metas` | `pages/metas/MetasPage.tsx` |
| `/calculadoras` | `pages/calculadoras/CalculadorasPage.tsx` |
| `/configuracoes` | `pages/configuracoes/ConfiguracoesPage.tsx` |

### PWA

Já configurado via `vite-plugin-pwa` em `vite.config.ts`: manifest, ícones 192/512 maskable, workbox com `NetworkFirst` em `/api/`, `push-handler.js` para Web Push.

**Service Worker exige secure context.** Funciona em `localhost` e `https://`. Acessar por `http://<ip-da-lan>` no celular não registra o SW e não oferece instalação. Mobile não é foco atual; a UI deve continuar responsiva, mas não há hospedagem.

### Sistema de Temas

10 temas via CSS variables em `src/index.css`. Cada tema define `--bg-body`, `--bg-card`, `--bg-sidebar`, `--bg-elevated`, `--text-primary`, `--text-muted`, `--border-color`, `--accent-50` a `--accent-900`.

Escuros (adicionam class `dark`): `slate-dark`, `midnight-blue`, `forest`, `obsidian`, `crimson`
Claros: `cloud`, `sage`, `lavender`, `sand`, `arctic`

No `tailwind.config.js`, cores estruturais via CSS vars: `bg-bg-body`, `bg-bg-card`, `bg-bg-sidebar`, `bg-bg-elevated`, `text-c-primary`, `text-c-muted`, `border-c-border`.

Tamanhos de fonte sobrescritos: `text-xs`=13px, `text-sm`=15px, `text-base`=17px.

---

## Problemas Conhecidos e Decisões

- **Porta 5435:** evita conflito com PostgreSQL local na 5432.
- **`ddl-auto: none`:** Flyway é a única fonte de verdade. Não mudar para `validate`.
- **`spring-boot-starter-flyway`:** necessário no SB4 além do `flyway-core`.
- **RestAssured:** não usar — NPE no Java 21 via Groovy. Usar `RestTemplate`.
- **CORS:** `allowedOriginPatterns` a partir de `app.cors.allowed-origins`, com fallback para `*`.
- **Testcontainers:** não usar — `docker-java` embutido negocia API antiga, Docker 29+ recusa. Testes de integração usam Postgres real (ver Testes e Qualidade acima).
