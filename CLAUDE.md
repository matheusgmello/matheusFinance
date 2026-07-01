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

**matheusFinance** é uma aplicação web de controle financeiro pessoal com foco principal em **calculadora de IR e declaração de impostos**. Arquitetura monorepo com backend Java e frontend React separados.

- **Backend:** Spring Boot 4.0.5 + Java 21 (Zulu JDK) + PostgreSQL
- **Frontend:** React 18 + Vite + Tailwind CSS + TanStack Query + Recharts
- **Infra:** Docker Compose (PostgreSQL exposto na porta **5435** — porta local 5432 está ocupada por instância local)

---

## Comandos Essenciais

### Infraestrutura

```bash
# Subir apenas o PostgreSQL (necessário para rodar o backend localmente)
docker compose up postgres -d
```

### Backend (`/backend`)

```bash
# JDK obrigatório: Zulu 21 — C:/Program Files/Java/zulu-jdk-21
JAVA_HOME="C:/Program Files/Java/zulu-jdk-21"

# Compilar
mvn compile

# Rodar localmente (requer postgres container rodando)
mvn spring-boot:run

# Rodar todos os testes
mvn test

# Rodar um teste específico
mvn test -Dtest=PerfilServiceTest

# Build do jar
mvn package -DskipTests
```

### Frontend (`/frontend`)

```bash
cd frontend
npm install
npm run dev      # Vite dev server em localhost:5173 (expõe na rede local via host: true)
npm run build    # Build de produção
```

---

## Arquitetura do Backend

### Estrutura de Pacotes (package-by-feature)

```
com.matheusfinance/
├── auth/            # Autenticação por e-mail+senha JWT (AuthController, AuthService, AuthDTO, Usuario, UsuarioRepository)
├── perfil/          # Perfis por usuário (multi-perfil), isolamento por usuarioId
├── cartao/          # Cartões de crédito
├── compra/          # Compras parceladas + geração de parcelas
├── recorrente/      # Pagamentos fixos mensais + checklist
├── dashboard/       # Agregações para gráficos
├── investimento/    # Import de posições B3 (Ações, FIIs, Tesouro Direto)
├── ir/              # Calculadora IR/DARF: operações, apuração mensal, PDF
├── alertapreco/     # Alertas de preço por ticker (disparo automático via @Scheduled)
├── meta/            # Metas de economia com aportes e projeção
├── patrimonio/      # Histórico de snapshots de patrimônio
├── push/            # Web Push notifications (VAPID)
└── shared/
    ├── config/      # SecurityConfig, JwtAuthFilter, JwtUtil, AppProperties
    └── exception/   # GlobalExceptionHandler, exceções customizadas
```

### Segurança e Autenticação

A API usa **e-mail + senha + JWT**. Sistema de PIN foi removido completamente.

**Fluxo:**
1. `POST /api/auth/register` — cria usuário + perfil vinculado, retorna JWT
2. `POST /api/auth/login` — valida email/senha, retorna JWT com `perfilId` e `usuarioId`
3. `POST /api/auth/switch-profile?perfilId=X` — troca de perfil, retorna novo JWT

**JWT contém dois claims:**
- `perfilId` — perfil ativo (validado contra `X-Perfil-Id` header)
- `usuarioId` — usuário dono dos perfis (usado para isolamento)

**`JwtAuthFilter`:** valida Bearer token. Para rotas fora de `/api/auth/` e que não sejam rotas de coleção de perfis, valida que `X-Perfil-Id == JWT.perfilId`. Expõe `jwtPerfilId` e `jwtUsuarioId` como atributos da request.

Rotas públicas (sem JWT): `/api/auth/**`, `/actuator/**`.

| Header | Propósito |
|--------|-----------|
| `Authorization: Bearer <token>` | Autenticação JWT |
| `X-Perfil-Id` | Multi-tenancy lógico — validado contra o claim do JWT |

**Isolamento de perfis:** `GET /api/perfis` filtra por `usuarioId` do JWT — usuário só vê seus próprios perfis. `POST /api/perfis` cria perfil vinculado ao usuário logado.

**Nunca remova o filtro por perfil nos repositórios** (`findByIdAndPerfilId`, `findAllByPerfilId`). É o único mecanismo de isolamento de dados entre perfis.

Configuração JWT em `application.yml`:
```yaml
app:
  jwt:
    secret: <segredo mínimo 32 chars>
    expiration-days: 7
```

### CORS

`SecurityConfig` usa `setAllowedOriginPatterns(["*"])` — aceita qualquer origin incluindo IPs de rede local (mobile/LAN). Não restringe por domínio em desenvolvimento.

### Regra de Negócio Central: IR/DARF

`ir/` implementa a apuração de imposto de renda sobre renda variável:

**Categorias:** `SWING_TRADE_ACAO` (15%, isenção ≤R$20k/mês), `DAY_TRADE_ACAO` (20%), `FII` (20%), `TREASURY` (tabela regressiva, código DARF 0977), `BDR_ETF` (15%/20%), `STOCK_INT` (15%/20%)

**Fluxo:** operações de compra/venda → custo médio ponderado → apuração mensal com compensação de prejuízo acumulado → DARF PDF (código 6015 ou 0977)

**Import:** CSV da B3 via `POST /api/v1/ir/operacoes/import`

**PDF:** PDFBox 3.0.2 para DARF e declaração IRPF

### Regra de Negócio: Parcelamento

`ParcelamentoCalculator` em `compra/`:
- Se `diaCompra >= diaFechamento` do cartão → 1ª parcela vence **dois meses à frente**
- Caso contrário → 1ª parcela vence **no próximo mês**
- Ajuste automático para meses com menos dias

Testado exaustivamente em `ParcelamentoCalculatorTest`. **Sempre rode esses testes ao alterar qualquer lógica de datas.**

### Cotação do Tesouro Direto

`TreasuryPriceService` atualiza `currentPrice` de posições TREASURY com três estratégias em cascata:
1. API do Tesouro Nacional (`tesourodireto.com.br/json/...`) — preço real de resgate
2. Estimativa BCB — taxa SELIC/IPCA atual via `api.bcb.gov.br`
3. Fallback pela `taxaAnual` gravada no import

### Schema e Migrations

Flyway gerencia o schema — `ddl-auto: none`. Migrations em `src/main/resources/db/migration/`:

| Migration | Conteúdo |
|-----------|----------|
| V1–V4 | perfis, cartoes, compras_parceladas, pagamentos_recorrentes |
| V5–V9 | investment_positions, alertas_preco, metas, patrimônio |
| V10–V15 | PIN/JWT (legado), índices, taxa_anual |
| V16–V20 | proventos, rebalanceamento, operacoes, asset types, CPF |
| V21 | usuarios (e-mail+senha), usuario_id em perfis |
| V22 | push_subscriptions |
| V23 | remove senha_hash de perfis (PIN removido) |

**Próxima migration disponível: V24**

**Importante:** Em Spring Boot 4, o autoconfigure do Flyway está em `spring-boot-starter-flyway` (separado de `flyway-core`). Ambos devem estar no `pom.xml`.

### Testes

- **Unit:** JUnit 5 + Mockito — sem banco, sem Spring context
- **Integration:** `@SpringBootTest(webEnvironment = RANDOM_PORT)` + `RestTemplate` puro + Testcontainers
- **Profile de teste:** `application-test.yml` ativa Testcontainers e Flyway

**Atenção:** Em Spring Boot 4, `@AutoConfigureMockMvc` foi removido. RestAssured 5.5.0 **não deve ser usado** — lança NPE no Java 21 via Groovy (`MetaClassImpl.getMetaProperty`). Usar `RestTemplate` com `@LocalServerPort`.

---

## Arquitetura do Frontend

### Fluxo de Estado

```
ThemeProvider (React Context)
  └── themeKey (10 temas completos) → persiste em localStorage como 'appTheme'
      aplica class 'theme-{key}' + 'dark' (se escuro) no <html>

AuthContext (React Context)
  └── token + perfilId + perfilNome → persiste em localStorage como 'mf_auth'

ProfileContext (React Context)
  └── activeProfile → persiste em localStorage como 'activeProfile'

setupAxiosInterceptors(perfilId, token) → injeta Authorization + X-Perfil-Id em toda request
```

### Sistema de Temas

10 temas completos via CSS variables em `src/index.css`. Cada tema define:
- `--bg-body`, `--bg-card`, `--bg-sidebar`, `--bg-elevated`
- `--text-primary`, `--text-muted`, `--border-color`
- `--accent-50` a `--accent-900`

**Temas escuros** (adicionam class `dark` no `<html>`): `slate-dark`, `midnight-blue`, `forest`, `obsidian`, `crimson`

**Temas claros:** `cloud`, `sage`, `lavender`, `sand`, `arctic`

No `tailwind.config.js`, cores estruturais via CSS vars: `bg-bg-body`, `bg-bg-card`, `bg-bg-sidebar`, `bg-bg-elevated`, `text-c-primary`, `text-c-muted`, `border-c-border`.

**Tamanhos de fonte aumentados:** `text-xs`=13px, `text-sm`=15px, `text-base`=17px (sobrescritos no `tailwind.config.js`).

### Camada de API

Cada arquivo em `src/api/` corresponde a um domínio. Todas as chamadas usam a instância `api` do `src/api/axios.ts` (já injeta headers). Interceptor redireciona para `/login` em 401 ou 403.

### Páginas

| Rota | Arquivo |
|------|---------|
| `/login` | `pages/auth/LoginPage.tsx` |
| `/register` | `pages/auth/RegisterPage.tsx` |
| `/` | `pages/dashboard/DashboardPage.tsx` — tabs: Resumo, Cartões, Compras, Recorrentes |
| `/investimentos` | `pages/investimentos/InvestimentosPage.tsx` — Carteira, Proventos, Histórico, Benchmark, Alertas, Rebalancear, Importar |
| `/ir` | `pages/ir/IrPage.tsx` — Operações, Apuração IR |
| `/calculadoras` | `pages/calculadoras/CalculadorasPage.tsx` — Juros Compostos, Preço Médio, Projeção |
| `/metas` | `pages/metas/MetasPage.tsx` |
| `/configuracoes` | `pages/configuracoes/ConfiguracoesPage.tsx` — Perfis, Notificações, Zona de Perigo |

### Componentes UI

Reutilizáveis em `src/components/ui/`: `Card`, `Button`, `Input`, `Badge`, `PageHeader`, `CategoriaSelect`.

Layout em `src/components/layout/`: `AppShell` (header + seletor de temas), `Sidebar` (nav + perfil ativo + logout).

---

## Configuração de Ambiente Local

| Config | Valor |
|--------|-------|
| PostgreSQL host | `localhost:5435` (Docker) |
| Backend | `http://localhost:8085` |
| Frontend dev | `http://localhost:5173` |
| JDK | Zulu 21 — `C:/Program Files/Java/zulu-jdk-21` |

No IntelliJ: `File → Project Structure → SDK` deve apontar para Zulu 21. Annotation Processing deve estar habilitado (Lombok).

---

## Problemas Conhecidos e Decisões

- **Porta 5435:** PostgreSQL usa 5435 externamente para evitar conflito com instância local na 5432.
- **`ddl-auto: none`:** Flyway é a única fonte de verdade do schema. Não mude para `validate`.
- **`spring-boot-starter-flyway`:** necessário no SB4 além do `flyway-core` para o autoconfigure funcionar.
- **RestAssured:** não usar — NPE no Java 21 via Groovy. Usar `RestTemplate` nos testes de integração.
- **CORS:** `allowedOriginPatterns("*")` — aceita mobile/LAN sem configuração adicional.
- **Scripts .bat/.sh:** removidos. Subir manualmente: `docker compose up postgres -d` + `mvn spring-boot:run` + `npm run dev`.
- **Vite `host: true`:** configurado em `vite.config.ts` — frontend já expõe na rede local sem flag extra.
