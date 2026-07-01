# matheusFinance — Instruções de Execução

## Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| Java (Zulu JDK) | 25 LTS | Instalar em `C:/Program Files/Java/zulu-jdk-25` |
| Maven | 3.9+ | Normalmente já vem com o IntelliJ |
| Docker Desktop | Qualquer recente | Necessário para o PostgreSQL |
| Node.js | 20+ | Para rodar o frontend |
| npm | 10+ | Vem junto com o Node |

---

## 1. Banco de Dados (PostgreSQL via Docker)

O projeto usa PostgreSQL rodando em container Docker na porta **5435** (5432 é reservada para qualquer PostgreSQL local que você tenha instalado).

```bash
# Na raiz do projeto (onde está o docker-compose.yml)
docker compose up postgres -d
```

Verifique se subiu:
```bash
docker compose ps
# Deve aparecer: matheusfinance-db   Up (healthy)
```

Credenciais do banco:
- **Host:** `localhost:5435`
- **Banco:** `matheusfinance`
- **Usuário:** `finance_user`
- **Senha:** `finance_pass`

> Para parar: `docker compose stop postgres`  
> Para apagar os dados e começar do zero: `docker compose down -v`

---

## 2. Backend (Spring Boot)

### Opção A — IntelliJ IDEA (recomendado)

1. Abra o IntelliJ e importe a pasta `backend/` como projeto Maven
2. Vá em `File → Project Structure → Project → SDK` e selecione **Zulu 25**
3. Vá em `File → Settings → Build → Compiler → Annotation Processors` e marque **Enable annotation processing**
4. Clique em **Reload Maven Project** no painel Maven (ícone de refresh)
5. Execute a classe `MatheusFinanceApplication` com o botão Run ▶

### Opção B — Terminal

```bash
cd backend

# Windows (Git Bash / PowerShell)
JAVA_HOME="C:/Program Files/Java/zulu-jdk-25" mvn spring-boot:run

# Ou exporte antes
export JAVA_HOME="C:/Program Files/Java/zulu-jdk-25"
mvn spring-boot:run
```

### Verificando se subiu

Acesse: [http://localhost:8085/actuator/health](http://localhost:8085/actuator/health)

Resposta esperada:
```json
{"status":"UP"}
```

> O Flyway roda automaticamente na inicialização e cria todas as tabelas no banco.

---

## 3. Frontend (React + Vite)

```bash
cd frontend

# Instalar dependências (apenas na primeira vez ou após atualizar package.json)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

---

## 4. Primeiro acesso — Configuração inicial

Na primeira vez que abrir o app, siga estes passos na ordem:

### Passo 1 — Configurar a Master Key
1. Acesse a página **Perfis** (ícone de usuários no menu lateral)
2. No campo **Chave de Acesso**, insira: `changeme123`
3. Clique em **Salvar**

> Essa chave é enviada em toda requisição para o backend como header `X-Master-Key`. O valor padrão é `changeme123` — pode ser alterado via variável de ambiente `APP_MASTER_KEY` no backend.

### Passo 2 — Criar um perfil
1. Na mesma página **Perfis**, preencha o campo **Nome do perfil**
2. Clique em **Criar**
3. Clique em **Selecionar** no perfil criado

> O perfil ativo é salvo no `localStorage` do navegador. Todas as consultas ao backend serão filtradas pelo ID desse perfil.

### Passo 3 — Usar o app
Com o perfil ativo, navegue pelo menu:
- **Dashboard** — visão geral do mês e projeção de 12 meses
- **Cartões** — cadastre seus cartões de crédito (nome, dia de vencimento, dia de fechamento)
- **Compras** — registre compras parceladas (requer ao menos um cartão cadastrado)
- **Recorrentes** — cadastre contas fixas e marque como pagas mês a mês

---

## 5. Rodando tudo com Docker (opcional)

Para subir backend + frontend + banco juntos em container:

```bash
# Na raiz do projeto
cp .env.example .env          # Copie o arquivo de variáveis
docker compose up --build     # Builda e sobe tudo
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8085 |
| PostgreSQL | localhost:5435 |

> O build completo pode levar alguns minutos na primeira vez (Maven baixa dependências dentro do container).

---

## 6. Rodando os testes

```bash
cd backend

# Todos os testes (unit + integração com Testcontainers — sobe um PostgreSQL temporário automaticamente)
JAVA_HOME="C:/Program Files/Java/zulu-jdk-25" mvn test

# Apenas um arquivo de teste
mvn test -Dtest=PerfilServiceTest
mvn test -Dtest=ParcelamentoCalculatorTest

# Apenas um método específico
mvn test -Dtest=ParcelamentoCalculatorTest#compraAntesDoFechamento_venceNoProximoMes
```

> Os testes de integração **não precisam** do container PostgreSQL rodando — o Testcontainers sobe e derruba um banco isolado automaticamente.

---

## Resolução de Problemas Comuns

| Problema | Solução |
|---|---|
| `ClassNotFoundException: MatheusFinanceApplication` | Projeto não compilado. No IntelliJ: `Build → Build Project` ou rode `mvn compile` |
| `senha falhou para o usuário "finance_user"` | PostgreSQL não está rodando ou está na porta errada. Rode `docker compose up postgres -d` e confirme que usa a porta 5435 |
| `Port 8085 was already in use` | Outro processo está usando a porta. Encerre o processo anterior antes de iniciar novamente |
| `missing table [cartoes]` | O `ddl-auto` foi alterado para `validate` antes do Flyway rodar. Mantenha `ddl-auto: none` — o Flyway gerencia o schema |
| Frontend não conecta na API | Confirme que o backend está rodando em `localhost:8085` e que a Master Key está configurada na página Perfis |
| `403 Forbidden` nas requisições | Master Key ausente ou incorreta. Verifique o campo na página Perfis ou o valor de `APP_MASTER_KEY` no backend |
