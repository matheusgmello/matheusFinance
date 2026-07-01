# matheusFinance

![Preview do Sistema](images/preview.gif)

> Aplicação web de controle financeiro pessoal com foco em calculadora de IR e declaração de impostos para investidores pessoa física.

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-brightgreen?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## O que é

Uma aplicação web local para investidores que precisam apurar IR sobre renda variável, gerar DARFs e organizar a declaração anual do IRPF — sem depender de planilhas. Tudo roda na sua máquina e os dados ficam no seu banco.

**Funcionalidades principais:**

- **Calculadora de IR** — apuração mensal por categoria (Swing Trade, Day Trade, FII, Tesouro Direto, BDR/ETF, Ações Int.), com compensação automática de prejuízos acumulados e isentômetro visual para ações
- **DARF em PDF** — geração do documento pronto para pagamento (código 6015 ou 0977)
- **Declaração IRPF em PDF** — relatório de bens e direitos + renda variável para auxiliar no preenchimento do programa da Receita
- **Import CSV da B3** — importe o extrato de operações diretamente do portal da B3
- **Carteira de investimentos** — posições B3 (Ações, FIIs, BDRs, ETFs, Tesouro Direto) com cotação em tempo real, P&L, proventos e benchmark
- **Dashboard financeiro** — cartões de crédito, compras parceladas, pagamentos recorrentes
- **Multi-perfil** — um usuário pode ter vários perfis (ex: família)
- **10 temas visuais** — 5 dark + 5 light, persistidos no navegador

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | Spring Boot 4.0.5, Java 21 (Zulu JDK), Spring Data JPA, Flyway, PDFBox 3, Apache POI |
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, Recharts, Lucide |
| Banco | PostgreSQL 16 via Docker Compose |
| Testes | JUnit 5, Mockito, Testcontainers |

---

## Começando

### Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| [Zulu JDK 21](https://www.azul.com/downloads/) | 21 (LTS) |
| [Maven](https://maven.apache.org/) | 3.9+ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Qualquer recente |
| [Node.js](https://nodejs.org/) | 20+ |

### Passo a passo

**1. Banco de dados**

```bash
docker compose up postgres -d
```

O PostgreSQL sobe na porta **5435**. O Flyway cria todas as tabelas automaticamente na primeira inicialização.

**2. Backend**

```bash
cd backend

# Configure as variáveis de ambiente (token Brapi, JWT secret, etc.)
cp .env.example .env

JAVA_HOME="C:/Program Files/Java/zulu-jdk-21" mvn spring-boot:run
```

Backend em **http://localhost:8085**.

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend em **http://localhost:5173** (também acessível na rede local para mobile).

**4. Primeiro acesso**

1. Acesse **http://localhost:5173**
2. Crie uma conta em **Registrar**
3. Comece registrando suas operações de compra e venda em **IR / DARF**

---

## Estrutura do projeto

```
matheusFinance/
├── backend/
│   └── src/main/java/com/matheusfinances/
│       ├── auth/           # Autenticação e-mail + senha, JWT, multi-perfil
│       ├── perfil/         # Perfis por usuário
│       ├── cartao/         # Cartões de crédito
│       ├── compra/         # Compras parceladas + cálculo de vencimento
│       ├── recorrente/     # Pagamentos fixos + checklist mensal
│       ├── investimento/   # Posições B3, cotações, P&L, proventos
│       ├── ir/             # Calculadora IR, apuração, DARF PDF, declaração IRPF
│       ├── meta/           # Metas de economia
│       ├── patrimonio/     # Histórico de patrimônio
│       ├── push/           # Notificações push (VAPID)
│       └── shared/         # Config, segurança, exceções globais
│
├── frontend/
│   └── src/
│       ├── api/            # Camada HTTP por domínio
│       ├── components/     # Design system + layout (AppShell, Sidebar)
│       ├── context/        # AuthContext, ThemeContext, ProfileContext
│       └── pages/          # Dashboard, IR, Investimentos, Calculadoras, Metas, Configurações
│
└── docker-compose.yml
```

---

## Calculadora de IR

### Categorias suportadas

| Categoria | Alíquota | Isenção |
|-----------|----------|---------|
| Swing Trade — Ações | 15% | Vendas ≤ R$ 20.000/mês |
| Day Trade — Ações | 20% | Sem isenção |
| FII | 20% | Sem isenção |
| Tesouro Direto | 15% a 22,5% (regressivo) | Sem isenção |
| BDR / ETF | 15% / 20% | — |
| Ações internacionais | 15% / 20% | — |

### Fluxo de uso

1. Registre operações manualmente ou importe o CSV exportado pelo portal B3
2. Acesse **Apuração IR** e selecione o ano
3. O sistema calcula o imposto por mês/categoria, descontando prejuízos acumulados
4. Clique em **Gerar DARF** para baixar o PDF pronto para pagamento

---

## Importação de posições B3

1. Exporte seu extrato de posições no portal da B3 (`.csv` ou `.xlsx`)
2. Em **Investimentos → Importar**, selecione o arquivo
3. O sistema detecta o formato automaticamente e atualiza a carteira

Cotações são atualizadas automaticamente a cada 15 minutos durante o pregão (via Brapi para ações/FIIs e API do Tesouro Nacional para títulos).

---

## Testes

```bash
cd backend

# Todos os testes (unit + integração com Testcontainers)
mvn test

# Testes específicos
mvn test -Dtest=ParcelamentoCalculatorTest
mvn test -Dtest=PerfilServiceTest
```

Os testes de integração usam **Testcontainers** — um PostgreSQL temporário sobe e desce automaticamente. Docker Desktop precisa estar rodando.

---

## Variáveis de ambiente

Configure em `backend/.env` a partir de `backend/.env.example`:

| Variável | Descrição |
|----------|-----------|
| `BRAPI_TOKEN` | Token da [Brapi](https://brapi.dev) para cotações em tempo real |
| `JWT_SECRET` | Segredo JWT (mínimo 32 caracteres) |
| `SPRING_DATASOURCE_URL` | URL do banco (padrão: `jdbc:postgresql://localhost:5435/matheusfinance`) |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco |

---

## Solução de problemas

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Frontend não carrega dados | Backend fora do ar | Verifique se o Spring Boot subiu em `localhost:8085` |
| Erro de conexão com banco | PostgreSQL não está rodando | `docker compose up postgres -d` |
| `Port 8085 already in use` | Outra instância rodando | Encerre o processo anterior |
| Cotações não atualizam | `BRAPI_TOKEN` não configurado | Preencha `BRAPI_TOKEN` no `backend/.env` |

---

## Licença

Uso pessoal. Sem licença de distribuição.
