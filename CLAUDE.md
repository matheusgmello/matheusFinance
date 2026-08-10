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

O foco é a **entrada de dados sem digitação**: import de CSV de fatura. Digitação manual foi o que fez o projeto ser abandonado antes.

---

## Comandos Essenciais

### Infraestrutura

```bash
# Subir apenas o PostgreSQL (necessário para rodar o backend localmente)
docker compose up postgres -d
```

### Backend (`/backend`)

```bash
# JDK obrigatório: Zulu 21
mvn compile
mvn spring-boot:run    # requer postgres container rodando
mvn package -DskipTests
```

### Frontend (`/frontend`)

```bash
cd frontend
npm install
npm run dev      # Vite dev server em localhost:5173 (expõe na rede local via host: true)
npm run build    # tsc + vite build
npx tsc --noEmit # typecheck isolado
```

---

## Arquitetura do Backend

```
com.matheusfinance/
├── core/
│   ├── security/          # JwtAuthFilter, JwtUtil
│   └── api/exception/     # GlobalExceptionHandler + exceções HTTP
├── infra/
│   ├── config/            # SecurityConfig, AppProperties, SchedulingConfig
│   ├── persistence/       # BackupService (backup JSON diário)
│   └── util/              # SpreadsheetReader
└── features/              # cada feature isolada, package-by-feature
    ├── auth/              # e-mail + senha + JWT
    ├── perfil/            # perfis, export/import, limpar dados
    ├── cartao/
    ├── compra/            # compras parceladas, parcelas, fatura, ParcelamentoCalculator
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

Entrada de dados é **CSV de fatura** exportado do banco. Nubank e Itaú exportam CSV; o Itaú deixou de oferecer OFX para fatura de cartão.

**Idempotência é por fatura, não por transação:** a unidade de import é `(cartão, mês de referência)`. Reimportar substitui o conteúdo daquele mês inteiro. Isso evita dedup frágil por hash de `data + valor + descrição`, que descartaria compras legitimamente idênticas.

O modelo de transação deve permanecer **agnóstico de formato** — o parser converte na fronteira, o domínio não sabe a origem. Isso mantém um parser OFX barato de adicionar quando houver arquivo real para testar.

### Schema e Migrations

Flyway é a única fonte de verdade — `ddl-auto: none`, `validate-on-migrate: true`.

**Migrations nunca são deletadas.** Apagar arquivo de `db/migration/` quebra o boot por checksum. V1–V23 permanecem, incluindo as de tabelas hoje órfãs (investimentos, operações, proventos, patrimônio, alertas de preço, rebalanceamento). Dropar essas tabelas é decisão separada, adiada.

**Próxima migration disponível: V24**

Em Spring Boot 4 o autoconfigure do Flyway está em `spring-boot-starter-flyway`, separado de `flyway-core`. Ambos são necessários no `pom.xml`.

### Testes

**Não existem testes.** O workflow em `.github/workflows/ci.yml` roda `mvn test`, que passa vazio — o badge verde não verifica nada.

Prioridade declarada do projeto é integridade de dados. Quando houver testes, começar por: `ParcelamentoCalculator` (lógica de datas) e o ciclo export → import de perfil.

Ao escrever testes de integração: `@AutoConfigureMockMvc` foi removido no Spring Boot 4, e RestAssured 5.5.0 lança NPE no Java 21 via Groovy. Usar `RestTemplate` com `@LocalServerPort`.

### Export / Import e Backup

`PerfilExportImportService` serializa perfil em JSON. `BackupService` grava backup diário por perfil em `./backups`, retenção 30 dias.

**Limitação conhecida:** o backup cobre cartões, compras com parcelas e recorrentes com checklist. **Não cobre orçamentos, receitas, categorias nem metas** — exportar e reimportar perde esses dados silenciosamente.

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

## Configuração de Ambiente Local

| Config | Valor |
|--------|-------|
| PostgreSQL host | `localhost:5435` (Docker) |
| Backend | `http://localhost:8085` |
| Frontend dev | `http://localhost:5173` |
| JDK | Zulu 21 |

IntelliJ: SDK apontando para Zulu 21, Annotation Processing habilitado (Lombok).

---

## Problemas Conhecidos e Decisões

- **Porta 5435:** evita conflito com PostgreSQL local na 5432.
- **`ddl-auto: none`:** Flyway é a única fonte de verdade. Não mudar para `validate`.
- **`spring-boot-starter-flyway`:** necessário no SB4 além do `flyway-core`.
- **RestAssured:** não usar — NPE no Java 21 via Groovy. Usar `RestTemplate`.
- **CORS:** `allowedOriginPatterns` a partir de `app.cors.allowed-origins`, com fallback para `*`.
- **Scripts .bat/.sh:** removidos. Subir manualmente: `docker compose up postgres -d` + `mvn spring-boot:run` + `npm run dev`.
- **Vite `host: true`:** frontend já expõe na rede local sem flag extra.
- **Backup incompleto:** ver seção Export / Import acima.
