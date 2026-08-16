# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Usuário único: o próprio dono do projeto, controlando as próprias finanças pessoais. Não há multi-tenant real de produto — a estrutura de "perfis" no backend é multi-perfil lógico dentro de uma única conta, mantida por custo de remoção, não por necessidade de múltiplos usuários simultâneos.

Situação de uso: revisão financeira periódica (mensal, ao fechar fatura de cartão) e consultas pontuais (checar orçamento, ver parcelas em aberto, lançar meta). Uso via desktop majoritariamente; mobile não é foco (PWA existe mas app não é hospedado publicamente).

## Product Purpose

Substituir a planilha de controle de gastos pessoal. Gerencia cartões, faturas, compras parceladas, pagamentos recorrentes, orçamento e relatórios. Sucesso = o usuário confia nos números o suficiente para nunca mais voltar a editar uma planilha manualmente.

## Positioning

Diferencial: entrada de dados sem digitação. Import de fatura (CSV ou PDF, Nubank e Itaú) categoriza compras automaticamente aprendendo do histórico do próprio usuário. A tentativa anterior do projeto foi abandonada por causa de digitação manual — esse é o problema que o produto existe para resolver, e é a lente pela qual toda tela deve ser julgada: qualquer fluxo que reintroduza digitação repetitiva é uma regressão ao motivo do abandono anterior.

## Operating Context

Fluxo típico: fatura fecha → importa PDF/CSV do banco → sistema categoriza automaticamente por histórico → usuário revisa/ajusta o que for exceção → dashboard/orçamento refletem o mês. Fora do ciclo de fatura: acompanhar recorrentes (checklist mensal de pagamentos fixos), metas de economia com aportes, orçamento por categoria, calculadoras financeiras.

Rodando localmente: backend Spring Boot em `localhost:8085`, frontend Vite em `localhost:5173`, Postgres em `localhost:5435`. Sem hospedagem pública — uso é sempre local/LAN.

## Capabilities and Constraints

- Gestão de cartões, faturas, compras parceladas (com regra de fechamento automática), pagamentos recorrentes com checklist, categorias, orçamento, receitas, metas de economia, dashboard de agregações, relatórios (export CSV), alertas de vencimento, Web Push.
- Import de fatura: Nubank (CSV ou PDF) e Itaú (PDF apenas). Categorização aprendida do histórico de compras do próprio usuário, não digitada de novo.
- Autenticação usuário+senha (sem e-mail) com JWT; suporte a múltiplos perfis dentro de uma conta (troca de perfil), embora o uso real seja de uma pessoa só.
- 10 temas de cor (5 escuros, 5 claros) já implementados via CSS variables — ver Evidence on Hand.
- Fora de escopo deliberado: IR/DARF e acompanhamento de carteira de investimentos (removidos; ferramentas externas cobrem melhor). Não reintroduzir sem razão nova.
- Constraint de redesign: nenhuma identidade visual está fixa — nome, paleta, tipografia e a implementação atual dos 10 temas podem mudar livremente. O conceito de múltiplos temas selecionáveis (claro/escuro) é o único elemento que deve seguir existindo, sem exigência de manter a mesma paleta ou quantidade.

## Brand Commitments

Nome do produto: slopFinance (renomeado de matheusFinance pelo usuário durante o redesign). Nenhum outro compromisso de marca é fixo — logo, paleta e tipografia estão livres para o redesign.

## Evidence on Hand

- Frontend atual: React 18 + Vite + Tailwind CSS + TanStack Query + Recharts, em `frontend/src/`. Estrutura: `core/` (api, types, hooks), `shared/` (context, components ui/layout), `domains/` (auth, cartao, compra, recorrente, dashboard, alertas, meta, configuracao), `pages/` (auth, dashboard, cartoes, compras, recorrentes, metas, calculadoras, configuracoes, perfis).
- Sistema de temas atual em `src/index.css`: 10 temas via CSS variables (`--bg-body`, `--bg-card`, `--bg-sidebar`, `--bg-elevated`, `--text-primary`, `--text-muted`, `--border-color`, `--accent-50` a `--accent-900`), aplicados via classe `theme-{key}` (+ `dark` nos escuros) no `<html>`.
- Nenhum asset de marca (logo, ícone customizado) além dos ícones PWA gerados (192/512 maskable).
- Estado atual do design: o próprio usuário descreve como "confuso e sem muito sentido" — tratar a UI existente como evidência de estrutura de dados/fluxos, não como direção visual a preservar.

## Product Principles

1. Zero digitação repetitiva é o princípio inegociável — todo fluxo novo deve ser julgado por quanta digitação manual ele evita, não adiciona.
2. Confiança nos números vem antes de estética: clareza de estado financeiro (quanto devo, quanto tenho, o que vence) tem prioridade sobre qualquer elemento decorativo.
3. Uso é solo e recorrente (mensal/pontual), não first-time onboarding constante — a interface pode assumir familiaridade crescente do único usuário, sem precisar reexplicar conceitos a cada visita.
4. Multi-perfil é infraestrutura, não produto — a UI não precisa vender ou enfatizar a troca de perfil como funcionalidade central.
5. Sem hospedagem pública: a interface não precisa otimizar para aquisição, prova social ou first impression de estranhos — é uma ferramenta de uso privado e contínuo.

## Accessibility & Inclusion

Nenhum requisito específico levantado pelo usuário. Seguir boas práticas padrão (contraste, foco visível, tamanho de fonte legível) sem requisito adicional além disso.
