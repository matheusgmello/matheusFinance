# ROADMAP — matheusFinance

Foco: **calculadora de IR e declaração de impostos** para investidores pessoa física.

---

## Referência de Regras de Negócio IR

| Categoria | Código DARF | Alíquota | Isenção |
|-----------|-------------|----------|---------|
| Swing Trade — Ações | 6015 | 15% | Vendas ≤ R$ 20.000/mês |
| Day Trade — Ações | 6015 | 20% | Sem isenção |
| FII | 6015 | 20% | Sem isenção |
| Tesouro Direto | 0977 | 15% a 22,5% (regressivo por prazo) | Sem isenção |
| BDR / ETF | 6015 | 15% ST / 20% DT | — |
| Ações internacionais | 6015 | 15% ST / 20% DT | — |

**Compensação de prejuízo:** acumulado por categoria, deduzido antes de calcular o imposto do mês.

---

## IR-1 — IRRF e Histórico de DARFs

### IR-1.1 — Registro de IRRF por operação
- Campo `irrfRetido: BigDecimal` na entidade `Operacao` (V24 migration)
- Campo opcional no formulário de operação: "IRRF retido (R$)"
- Lógica: `impostoAPagar = max(0, baseCalculo × aliquota - totalIrrf)`
- Exibir `totalIrrf` e `impostoAPagar` separados na tela de apuração

### IR-1.2 — Histórico de DARFs gerados
- Tabela `darfs` (V25 migration): `mes`, `categoria`, `valor`, `vencimento`, `pago`, `dataPagamento`
- Ao gerar um DARF PDF, salvar automaticamente no histórico
- Tela de histórico: listar DARFs por ano, marcar como pago, filtrar pendentes

---

## IR-2 — Custo Médio e Taxas

### IR-2.1 — Bonificação, desdobramento e grupamento
- Novos tipos de operação: `BONIFICACAO`, `DESDOBRAMENTO`, `GRUPAMENTO`
- V26 migration: ampliar o enum `tipo_operacao` na tabela
- Lógica: bonificação ajusta custo médio sem alterar o preço médio; desdobramento e grupamento ajustam quantidade e preço médio proporcionalmente

### IR-2.2 — Taxas de corretagem
- Campo `taxas: BigDecimal` na entidade `Operacao` (embutido na V24 ou V26)
- Nas compras: custo médio = (quantidade × preço + taxas) / quantidade
- Nas vendas: resultado bruto = (preço × quantidade) - taxas - custo médio × quantidade
- Campo opcional no formulário: "Taxas/corretagem (R$)"

---

## IR-3 — Declaração IRPF

### IR-3.1 — Exportação `.DecIRPF`
- Gerar arquivo no formato aceito pelo programa da Receita Federal
- Seções: Bens e Direitos (posições em carteira), Renda Variável (resultado anual por categoria)
- Download via botão na aba de Apuração

### IR-3.2 — Relatório IRPF consolidado anual
- PDF com: resumo de operações por ticker, ganho/perda por categoria, IRRF total retido, imposto recolhido via DARF, saldo de prejuízo a compensar
- Útil para conferência antes de abrir o programa da Receita

---

## IR-4 — Automação e Alertas

### IR-4.1 — Notificação push de DARF vencendo
- Disparar push notification 3 dias antes do vencimento (último dia útil do mês seguinte)
- Integrar com o sistema de push já existente (VAPID)

### IR-4.2 — Apuração automática mensal
- Job `@Scheduled` que roda no 1º dia do mês
- Apura o mês anterior e salva resultado no banco
- Notifica via push se houver DARF a pagar

---

## IR-5 — Qualidade e UX

### IR-5.1 — CPF obrigatório para gerar DARF
- Validar que o perfil tem CPF preenchido antes de gerar o PDF
- Exibir aviso e redirecionar para Configurações → Perfil se CPF estiver vazio

### IR-5.2 — Simulador de IR
- Input: ticker + quantidade a vender + preço de venda estimado
- Output: ganho estimado, imposto estimado, isenção aplicável, DARF necessário
- Usar posições atuais como base de custo médio

### IR-5.3 — Snapshots de apuração para auditoria
- Salvar o resultado de cada apuração mensal no banco (imutável após gerado)
- Exibir histórico de apurações com diff se o usuário alterar operações retroativamente

---

## Prioridade sugerida

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | IR-1.1 IRRF por operação | Baixo | Alto |
| 2 | IR-2.2 Taxas de corretagem | Baixo | Alto |
| 3 | IR-1.2 Histórico de DARFs | Médio | Alto |
| 4 | IR-5.1 CPF obrigatório | Baixo | Médio |
| 5 | IR-5.2 Simulador de IR | Médio | Alto |
| 6 | IR-2.1 Bonificação/desdobramento | Médio | Médio |
| 7 | IR-3.2 Relatório IRPF PDF | Médio | Médio |
| 8 | IR-4.1 Push DARF vencendo | Baixo | Médio |
| 9 | IR-4.2 Apuração automática | Médio | Médio |
| 10 | IR-3.1 Exportação .DecIRPF | Alto | Alto |
| 11 | IR-5.3 Snapshots de auditoria | Alto | Baixo |
