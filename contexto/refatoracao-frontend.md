# Refatoração Frontend — Nova Arquitetura

Status: **COMPLETA** ✅

## Estrutura Nova

```
frontend/src/
├── core/                          # Compartilhado entre domains
│   ├── api/
│   │   └── axios.ts              # Instância axios + interceptors
│   ├── types/
│   │   └── index.ts              # LoginResponse, Profile, tipos IR, Investment
│   └── hooks/
│       ├── useAuth.ts
│       └── useProfile.ts
├── shared/
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ProfileContext.tsx
│   │   └── ThemeContext.tsx
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Input.tsx
│       │   ├── Badge.tsx
│       │   ├── PageHeader.tsx
│       │   └── index.ts
│       └── layout/
│           ├── AppShell.tsx
│           └── Sidebar.tsx
├── domains/                       # Por feature
│   ├── auth/
│   │   ├── api/
│   │   │   └── index.ts          # authApi
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── components/            # Se houver específicos de auth
│   ├── ir/
│   │   ├── api/
│   │   │   └── index.ts          # irApi + tipos OperacaoResponse, Apuracao, etc
│   │   ├── pages/
│   │   │   └── IrPage.tsx
│   │   └── components/            # Componentes IR específicos
│   ├── investimento/
│   │   ├── api/
│   │   │   └── index.ts          # investimentosApi + tipos PositionResponse, etc
│   │   ├── pages/
│   │   │   └── InvestimentosPage.tsx
│   │   └── components/
│   ├── dashboard/
│   │   ├── api/
│   │   │   └── index.ts          # dashboardApi
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx
│   │   └── components/
│   ├── cartao/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── CartoesPage.tsx
│   │   └── components/
│   ├── compra/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── ComprasPage.tsx
│   │   └── components/
│   ├── recorrente/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── RecorrentesPage.tsx
│   │   └── components/
│   ├── meta/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── MetasPage.tsx
│   │   └── components/
│   ├── configuracao/
│   │   ├── api/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   └── ConfiguracoesPage.tsx
│   │   └── components/
│   └── alertas/
│       ├── api/
│       │   └── index.ts          # alertasApi, alertasPrecoApi
│       └── components/            # Se houver
├── App.tsx                        # Rotas
└── main.tsx
```

## Guia de Migração

### ✅ Completado

**Core & Shared**
- [x] `/core/api/axios.ts` — instância axios + interceptors
- [x] `/core/types/index.ts` — tipos compartilhados (LoginResponse, Profile, TipoOperacao, AssetType, Categoria, InvestmentType)
- [x] `/core/hooks/useAuth.ts`, `useProfile.ts` — hooks wrapper
- [x] `/shared/context/` — AuthContext, ProfileContext, ThemeContext (+ Providers)
- [x] `/shared/components/ui/` — Button, Card, Input, Badge, PageHeader, CategoriaSelect (+ index.ts)
- [x] `/shared/components/layout/` — AppShell, Sidebar
- [x] `/shared/components/ErrorBoundary.tsx`

**APIs por Domain**
- [x] `/domains/auth/api/index.ts` — authApi
- [x] `/domains/ir/api/index.ts` — irApi + tipos (OperacaoResponse, Apuracao, etc)
- [x] `/domains/investimento/api/index.ts` — investimentosApi + patrimonioApi + proventosApi + rebalanceamentoApi + benchmarksApi + tipos
- [x] `/domains/alertas/api/index.ts` — alertasApi, alertasPrecoApi + tipos
- [x] `/domains/dashboard/api/index.ts` — dashboardApi + tipos
- [x] `/domains/dashboard/api/extra.ts` — receitasApi, faturaApi, relatoriosApi + tipos
- [x] `/domains/cartao/api/index.ts` — cartoesApi + tipos
- [x] `/domains/compra/api/index.ts` — comprasApi + tipos
- [x] `/domains/recorrente/api/index.ts` — recorrentesApi + tipos
- [x] `/domains/meta/api/index.ts` — metasApi + tipos
- [x] `/domains/configuracao/api/index.ts` — perfisApi, categoriasApi, orcamentosApi, pushApi + tipos

**Atualizado**
- [x] `App.tsx` — importa de nova estrutura
- [x] `main.tsx` — importa contextos de `/shared/context`
- [x] Todos os imports em `/pages/**/*.tsx` — migrados para novo padrão
- [x] Estrutura antiga deletada (`/api`, `/context`, `/components`)

### Verificação Final
```bash
✓ Sem imports remanescentes de /api fora de domains/core
✓ Sem imports de /context antigos
✓ Sem imports de /components antigos
✓ App.tsx compila corretamente
```

## Benefícios

✅ **Coesão:** APIs, tipos, componentes, páginas juntos por domain  
✅ **Escalabilidade:** Adicionar nova feature = criar pasta domain  
✅ **Isolamento:** Mudanças em uma feature não afetam outras  
✅ **Clareza:** `/core` para compartilhado, `/shared` para UI genérica, `/domains` para negócio  

## Notas

- Hooks customizados específicos de domain vão em `/domains/[feature]/hooks/`
- Tipos específicos de domain vão em `types/` dentro da domain ou como exports da `api/index.ts`
- Componentes reutilizáveis vão em `/shared/components/ui/`
- Componentes específicos de domain vão em `/domains/[feature]/components/`
