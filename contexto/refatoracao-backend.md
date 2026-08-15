# Refatoração Backend — Nova Arquitetura

Status: **COMPLETA** ✅

## Estrutura Nova

```
backend/src/main/java/com/matheusfinance/
├── core/                           # Compartilhado entre features
│   ├── domain/
│   │   ├── model/                 # Entidades genéricas (Usuario, Perfil, Asset)
│   │   ├── enum/                  # Enums: TipoAtivo, TipoOperacao, CategoriaIR, TipoProvento
│   │   ├── value/                 # Value objects se houver
│   │   └── exception/             # Exceções de domínio
│   ├── security/
│   │   ├── JwtAuthFilter.java
│   │   ├── JwtUtil.java
│   │   └── MasterKeyFilter.java
│   └── api/
│       ├── dto/                   # DTOs genéricos (Response<T>, Pagination, Error)
│       ├── controller/            # BaseController se houver
│       └── exception/             # GlobalExceptionHandler, exceções HTTP
│           ├── GlobalExceptionHandler.java
│           ├── ResourceNotFoundException.java
│           ├── PerfilMismatchException.java
│           └── InvalidFileFormatException.java
├── infra/                         # Infraestrutura
│   ├── config/
│   │   ├── AppProperties.java
│   │   ├── SecurityConfig.java
│   │   └── SchedulingConfig.java
│   ├── persistence/
│   │   ├── migrations/            # Flyway (db/migration/)
│   │   └── BackupService.java
│   ├── util/
│   │   └── SpreadsheetReader.java
│   └── log/                       # (vazio, pronto pra logging)
├── features/                      # Cada feature é isolada
│   ├── auth/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── perfil/
│   ├── ir/                        # Core do projeto — apuração, DARF, operações
│   ├── investimento/              # Carteira, import B3, posições
│   ├── cartao/
│   ├── compra/                    # Parcelamento, parcelas
│   ├── recorrente/
│   ├── meta/
│   ├── dashboard/                 # Resumos, consolidados
│   ├── categoria/
│   ├── orcamento/
│   ├── alerta/
│   ├── alertapreco/
│   ├── provento/                  # Dividendos, JCP, rendimento
│   ├── patrimonio/                # Snapshots de patrimônio
│   ├── benchmark/                 # Histórico de retornos
│   ├── rebalanceamento/
│   ├── receita/
│   ├── relatorio/
│   └── push/                      # Web Push notifications
└── MatheusFinanceApplication.java
```

## Reorganização Realizada

✅ **Arquivos movidos:**
- `shared/config/*` → `infra/config/` (AppProperties, SecurityConfig, SchedulingConfig)
- `shared/config/Jwt*` → `core/security/` (JwtAuthFilter, JwtUtil, MasterKeyFilter)
- `shared/exception/*` → `core/api/exception/` (GlobalExceptionHandler, exceções HTTP)
- `shared/util/SpreadsheetReader` → `infra/util/`
- `shared/backup/BackupService` → `infra/persistence/`
- Todos os packages de feature → `features/[name]/`

✅ **Imports atualizados:**
- Todos os `package` declarations
- Todos os `import` statements
- 0 imports remanescentes de `shared`

## Benefícios

✅ **Core explícito** — segurança, exceções, tipos num lugar  
✅ **Infra isolada** — mudanças BD não espalham  
✅ **Features independentes** — cada feature em sua pasta  
✅ **Escalável** — adicionar feature = criar `features/[name]/`  
✅ **Testável** — mock de core é consistente entre features  

## Próximos Passos Opcionais

Se precisar estruturar mais cada feature (que está em package-by-layer dentro delas):

```
features/ir/
├── api/
│   ├── OperacaoController.java
│   └── IrDTO.java
├── domain/
│   ├── OperacaoService.java (ou CalculadoraIrService)
│   └── Operacao.java (entity)
├── application/
│   └── (services, use cases se houver)
└── infrastructure/
    ├── OperacaoRepository.java
    └── IrMapper.java
```

Mas por enquanto, deixe cada feature com sua estrutura atual. Refatore package-by-layer se ficar grande.

## Notas

- Flyway continua em `db/migration/` (não movemos, é config de resources)
- `MatheusFinanceApplication.java` continua na raiz
- Sem mudanças em `pom.xml` (dependencies mesmas)
