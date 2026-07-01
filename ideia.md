# ideia.md — Histórico e Backlog de Ideias

Este arquivo reúne tudo que já foi implementado (histórico) e ideias futuras que saíram do escopo principal do ROADMAP atual.

---

## ✅ Já Implementado

### Infraestrutura e Auth
- [x] Spring Boot 4 + Java 21 (Zulu) + PostgreSQL via Docker
- [x] Flyway migrations (V1–V23)
- [x] Autenticação por e-mail + senha com JWT (7 dias)
- [x] Multi-tenant: cada usuário vê só seus próprios perfis
- [x] Switch-profile: troca de perfil gera novo JWT
- [x] CORS configurado para aceitar qualquer origin (mobile/LAN)
- [x] PWA instalável (vite-plugin-pwa, service worker, manifest)
- [x] Notificações push (Web Push API + VAPID)

### Dashboard
- [x] Resumo de faturas do mês atual e próximo
- [x] Indicadores de gastos recorrentes
- [x] Tabs: Resumo, Cartões, Compras, Recorrentes

### Cartões e Compras Parceladas
- [x] CRUD de cartões de crédito (nome, limite, dia vencimento, dia fechamento)
- [x] CRUD de compras parceladas com geração automática de parcelas
- [x] Edição de compras (regenera parcelas)
- [x] Edição de cartões
- [x] Regra de parcelamento: se diaCompra >= diaFechamento → vence dois meses à frente

### Pagamentos Recorrentes
- [x] CRUD de pagamentos recorrentes mensais (aluguel, assinaturas, etc.)
- [x] Checklist mensal (marcar como pago)

### Investimentos
- [x] Import de posições B3 (XLSX/CSV): Ações, FIIs, BDRs, ETFs, Tesouro Direto
- [x] Atualização automática de preços a cada 15 min (Brapi + Tesouro Nacional + BCB)
- [x] Proventos: calendário de recebimentos futuros
- [x] Gráfico de renda passiva mensal por tipo
- [x] Histórico de patrimônio (snapshots)
- [x] Benchmark vs IBOV/CDI/IPCA
- [x] Alertas de preço por ticker (disparo automático)
- [x] Rebalanceamento: alvos de alocação por ativo
- [x] Metas de economia com aportes e projeção

### IR / DARF
- [x] Registro manual de operações de compra/venda
- [x] Import CSV da B3
- [x] Categorias: Swing Trade Ações, Day Trade, FIIs, Tesouro, BDR/ETF, Ações Int.
- [x] Apuração mensal com compensação de prejuízo acumulado
- [x] Isentômetro visual (limite R$20k/mês ações swing)
- [x] PDF do DARF (iText7)
- [x] Exportação CSV das operações
- [x] Declaração IRPF em PDF (relatório bens e direitos + renda variável)
- [x] Filtros por ano, ticker, tipo e asset type

### Calculadoras
- [x] Juros compostos com aportes mensais (gráfico + tabela)
- [x] Calculadora de preço médio
- [x] Projeção "quando chego em R$ X" (gráfico de trajetória)

### UX e Design
- [x] 10 temas completos (5 dark + 5 light) com CSS variables
- [x] Fonte aumentada em toda a escala Tailwind
- [x] Tema selecionado persiste no localStorage
- [x] Layout expandido (sem restrições max-w nas páginas principais)
- [x] Sidebar com badge de alertas

---

## 💡 Ideias Fora do Escopo IR (Backlog Geral)

### Produto e Deploy
- [ ] **Deploy Railway + Vercel** — Railway para backend, Vercel para frontend
- [ ] **Capacitor APK** — gerar `.apk` para distribuição via link direto (WhatsApp)
- [ ] **Modo offline** — service worker mais robusto para funcionar sem internet
- [ ] **Exportação/importação de backup completo** — JSON com tudo do perfil

### Investimentos (futuro)
- [ ] **Proventos automáticos** — buscar histórico de dividendos/JCP via Brapi sem import manual
- [ ] **Nota de corretagem automática** — integração com corretoras via Open Finance
- [ ] **Projeção de renda passiva** — "em quantos anos alcanço X/mês de proventos"
- [ ] **Análise fundamentalista básica** — P/VP, DY, P/L dos ativos importados
- [ ] **Suporte a criptomoedas** — posições BTC, ETH, etc. com preço via CoinGecko

### Finanças Pessoais
- [ ] **Orçamento mensal** — categorias de gastos vs receitas com limite por categoria
- [ ] **Receitas/salário** — registrar entradas mensais para calcular taxa de poupança
- [ ] **Relatório patrimonial completo** — balanço: ativos (investimentos + saldo) vs passivos (dívidas/faturas)

### Gestão de Contas
- [ ] **Contas bancárias** — saldo de conta corrente, poupança
- [ ] **Transferências entre contas** — movimentações internas
- [ ] **Integração bancária** — leitura de extrato via OFX

### UX Avançado
- [ ] **Onboarding guiado** — passo-a-passo para novos usuários (criar cartão → registrar compra → ver dashboard)
- [ ] **Widget de resumo diário** — notificação push com resumo do dia (vencimentos, gastos, proventos)
- [ ] **Modo família** — múltiplos usuários no mesmo perfil com permissões diferentes

---

## 🔧 Alternativa aos Scripts .bat/.sh (Removidos)

Os arquivos `start.bat`, `start.sh`, `stop.bat` e `stop.sh` foram removidos.

### Como subir o projeto (desenvolvimento local)

**Opção 1 — Cada terminal separado (recomendado):**
```bash
# Terminal 1: PostgreSQL
docker compose up postgres -d

# Terminal 2: Backend (na pasta /backend)
JAVA_HOME="C:/Program Files/Java/zulu-jdk-21" mvn spring-boot:run

# Terminal 3: Frontend (na pasta /frontend)
npm run dev
```

**Opção 2 — Makefile (Linux/Mac/WSL):**
```makefile
# Instale make e use: make dev
dev:
    docker compose up postgres -d
    (cd backend && mvn spring-boot:run &)
    (cd frontend && npm run dev)
```

**Opção 3 — npm scripts na raiz (proposta):**
Criar `package.json` na raiz com `concurrently` para rodar tudo de um comando só.
Pendente decidir se vale a pena adicionar mais dependências.

**Opção 4 — Docker Compose full:**
`docker compose up --build` sobe tudo (postgres + backend + frontend) mas requer rebuild a cada mudança de código. Melhor para produção.

**Para parar:**
```bash
# Parar PostgreSQL
docker compose down

# Parar backend e frontend: Ctrl+C em cada terminal
```
