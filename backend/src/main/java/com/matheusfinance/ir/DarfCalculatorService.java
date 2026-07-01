package com.matheusfinance.ir;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Apuração mensal de IR para renda variável conforme legislação brasileira.
 *
 * Regras:
 * - Swing Trade Ações: 15%, isento se total vendido ≤ R$ 20.000/mês
 * - Day Trade Ações:   20%, sem isenção
 * - FIIs:              20%, sem isenção
 * - Tesouro Direto:    tabela regressiva por prazo de posse (22,5% → 15%)
 * - Prejuízos de uma categoria só compensam lucros da mesma categoria
 * - Tesouro usa FIFO para determinar prazo (e custo) de cada lote vendido
 */
@Service
@RequiredArgsConstructor
public class DarfCalculatorService {

    private static final BigDecimal ISENCAO_SWING = new BigDecimal("20000.00");
    private static final BigDecimal ALIQUOTA_SWING = new BigDecimal("15");
    private static final BigDecimal ALIQUOTA_DAY   = new BigDecimal("20");
    private static final BigDecimal ALIQUOTA_FII   = new BigDecimal("20");
    private static final int SCALE = 2;
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    public IrDTO.Apuracao apurar(List<Operacao> todasOps, Integer ano) {
        // Filtra por ano se informado (mas processa TODAS as ops para acumular custo médio/FIFO)
        List<IrDTO.ResumoPorCategoria> categorias = new ArrayList<>();

        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.SWING_TRADE_ACAO, ano));
        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.DAY_TRADE_ACAO, ano));
        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.FII, ano));
        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.TREASURY, ano));
        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.BDR_ETF, ano));
        categorias.add(apurarCategoria(todasOps, IrDTO.Categoria.STOCK_INT, ano));

        BigDecimal totalAno = categorias.stream()
                .map(IrDTO.ResumoPorCategoria::totalImpostoDevido)
                .reduce(ZERO, BigDecimal::add);

        return new IrDTO.Apuracao(categorias, totalAno);
    }

    private IrDTO.ResumoPorCategoria apurarCategoria(
            List<Operacao> todasOps, IrDTO.Categoria categoria, Integer ano) {

        // Ops pertencentes a esta categoria
        List<Operacao> ops = todasOps.stream()
                .filter(o -> pertenceCategoria(o, categoria))
                .sorted(Comparator.comparing(Operacao::getData).thenComparingLong(Operacao::getId))
                .toList();

        if (ops.isEmpty()) {
            return new IrDTO.ResumoPorCategoria(categoria, List.of(), ZERO, ZERO);
        }

        // ── Estado acumulado ──────────────────────────────────────────────────
        // Para Ações e FII: custo médio ponderado por ticker
        Map<String, BigDecimal> qtdPorTicker     = new HashMap<>();
        Map<String, BigDecimal> custoMedPorTicker = new HashMap<>();
        // Para Tesouro: FIFO de lotes (data_compra, qty, preco)
        Map<String, Deque<long[]>> fifoTreasury = new HashMap<>(); // lote: [epochDay, qty_x1e8, preco_x1e6]

        BigDecimal prejuizoAcumulado = ZERO;
        List<IrDTO.ApuracaoMensal> meses = new ArrayList<>();

        // Agrupa ops por mês
        Map<String, List<Operacao>> porMes = ops.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getData().getYear() + "-" + String.format("%02d", o.getData().getMonthValue()),
                        TreeMap::new, Collectors.toList()));

        for (var entry : porMes.entrySet()) {
            String mes = entry.getKey();
            List<Operacao> opsDoMes = entry.getValue();

            // Processa compras primeiro, depois vendas — dentro do dia mantém ordem original
            List<Operacao> compras = opsDoMes.stream().filter(o -> o.getTipo() == TipoOperacao.COMPRA).toList();
            List<Operacao> vendas  = opsDoMes.stream().filter(o -> o.getTipo() == TipoOperacao.VENDA).toList();

            // Atualiza custo médio com compras do mês
            for (Operacao c : compras) {
                if (categoria == IrDTO.Categoria.TREASURY) {
                    fifoTreasury.computeIfAbsent(c.getTicker(), k -> new ArrayDeque<>())
                            .addLast(new long[]{
                                    c.getData().toEpochDay(),
                                    c.getQuantidade().multiply(BigDecimal.valueOf(1e8)).longValue(),
                                    c.getPreco().multiply(BigDecimal.valueOf(1e6)).longValue()
                            });
                } else {
                    String t = c.getTicker();
                    BigDecimal qtdAtual   = qtdPorTicker.getOrDefault(t, ZERO);
                    BigDecimal custoAtual = custoMedPorTicker.getOrDefault(t, ZERO);
                    BigDecimal novaQtd = qtdAtual.add(c.getQuantidade());
                    BigDecimal novoMed = novaQtd.compareTo(ZERO) > 0
                            ? qtdAtual.multiply(custoAtual).add(c.getQuantidade().multiply(c.getPreco()))
                                      .divide(novaQtd, 6, RoundingMode.HALF_UP)
                            : ZERO;
                    qtdPorTicker.put(t, novaQtd);
                    custoMedPorTicker.put(t, novoMed);
                }
            }

            // Calcula resultado das vendas
            BigDecimal totalVendido = ZERO;
            BigDecimal custoVendido = ZERO;

            for (Operacao v : vendas) {
                BigDecimal valorVenda = v.getQuantidade().multiply(v.getPreco());
                totalVendido = totalVendido.add(valorVenda);

                if (categoria == IrDTO.Categoria.TREASURY) {
                    custoVendido = custoVendido.add(custoFifo(v, fifoTreasury));
                } else {
                    String t = v.getTicker();
                    BigDecimal cm = custoMedPorTicker.getOrDefault(t, ZERO);
                    custoVendido = custoVendido.add(cm.multiply(v.getQuantidade()));
                    // Reduz quantidade
                    BigDecimal qtdRestante = qtdPorTicker.getOrDefault(t, ZERO).subtract(v.getQuantidade());
                    qtdPorTicker.put(t, qtdRestante.max(ZERO));
                }
            }

            if (vendas.isEmpty()) {
                // Nenhuma venda — mês sem apuração, apenas compras processadas
                continue;
            }

            // Só emite resultado para meses dentro do ano filtrado (se filtro ativo)
            int anoMes = Integer.parseInt(mes.substring(0, 4));
            if (ano != null && anoMes != ano) continue;

            BigDecimal resultado = totalVendido.subtract(custoVendido).setScale(SCALE, RoundingMode.HALF_UP);

            // Alíquota e isenção
            BigDecimal aliquota = aliquotaPara(categoria);
            boolean isento = false;
            BigDecimal imposto = ZERO;
            BigDecimal prejuizoGerado = ZERO;
            BigDecimal baseCalculo = ZERO;
            BigDecimal prejuizoAnterior = prejuizoAcumulado;

            if (resultado.compareTo(ZERO) < 0) {
                // Prejuízo — acumula
                prejuizoGerado = resultado.negate();
                prejuizoAcumulado = prejuizoAcumulado.add(prejuizoGerado);
            } else {
                // Lucro — verifica isenção e compensa prejuízos
                if (categoria == IrDTO.Categoria.SWING_TRADE_ACAO
                        && totalVendido.compareTo(ISENCAO_SWING) <= 0) {
                    isento = true;
                    // Lucro isento: não paga IR mas também não compensa prejuízo acumulado
                } else {
                    baseCalculo = resultado.subtract(prejuizoAcumulado).max(ZERO);
                    imposto = baseCalculo.multiply(aliquota)
                                        .divide(BigDecimal.valueOf(100), SCALE, RoundingMode.HALF_UP);
                    // Reduz prejuízo acumulado pelo resultado positivo (mesmo que baseCalculo = 0)
                    prejuizoAcumulado = resultado.compareTo(prejuizoAcumulado) >= 0
                            ? ZERO
                            : prejuizoAcumulado.subtract(resultado);
                }
            }

            meses.add(new IrDTO.ApuracaoMensal(
                    mes, categoria,
                    totalVendido.setScale(SCALE, RoundingMode.HALF_UP),
                    custoVendido.setScale(SCALE, RoundingMode.HALF_UP),
                    resultado,
                    prejuizoAnterior.setScale(SCALE, RoundingMode.HALF_UP),
                    baseCalculo.setScale(SCALE, RoundingMode.HALF_UP),
                    aliquota,
                    imposto,
                    isento,
                    prejuizoGerado.setScale(SCALE, RoundingMode.HALF_UP),
                    prejuizoAcumulado.setScale(SCALE, RoundingMode.HALF_UP)));
        }

        BigDecimal totalImposto = meses.stream()
                .map(IrDTO.ApuracaoMensal::impostoDevido)
                .reduce(ZERO, BigDecimal::add);

        return new IrDTO.ResumoPorCategoria(categoria, meses, totalImposto, prejuizoAcumulado);
    }

    /** Calcula custo via FIFO para Tesouro Direto e retorna custo das cotas vendidas. */
    private BigDecimal custoFifo(Operacao venda, Map<String, Deque<long[]>> fifo) {
        Deque<long[]> lotes = fifo.computeIfAbsent(venda.getTicker(), k -> new ArrayDeque<>());
        BigDecimal qtdRestante = venda.getQuantidade();
        BigDecimal custoTotal = ZERO;

        while (qtdRestante.compareTo(ZERO) > 0 && !lotes.isEmpty()) {
            long[] lote = lotes.peekFirst();
            BigDecimal loteQtd   = BigDecimal.valueOf(lote[1]).divide(BigDecimal.valueOf(1e8), 8, RoundingMode.HALF_UP);
            BigDecimal lotePreco = BigDecimal.valueOf(lote[2]).divide(BigDecimal.valueOf(1e6), 6, RoundingMode.HALF_UP);

            if (loteQtd.compareTo(qtdRestante) <= 0) {
                custoTotal = custoTotal.add(loteQtd.multiply(lotePreco));
                qtdRestante = qtdRestante.subtract(loteQtd);
                lotes.pollFirst();
            } else {
                custoTotal = custoTotal.add(qtdRestante.multiply(lotePreco));
                lote[1] = loteQtd.subtract(qtdRestante).multiply(BigDecimal.valueOf(1e8)).longValue();
                qtdRestante = ZERO;
            }
        }
        return custoTotal;
    }

    /** Alíquota progressiva do Tesouro Direto pelo prazo de posse em dias. */
    @SuppressWarnings("unused")
    public static BigDecimal aliquotaTesouro(long diasPosse) {
        if (diasPosse <= 180)  return new BigDecimal("22.5");
        if (diasPosse <= 360)  return new BigDecimal("20");
        if (diasPosse <= 720)  return new BigDecimal("17.5");
        return new BigDecimal("15");
    }

    private BigDecimal aliquotaPara(IrDTO.Categoria cat) {
        return switch (cat) {
            case SWING_TRADE_ACAO -> ALIQUOTA_SWING;
            case DAY_TRADE_ACAO   -> ALIQUOTA_DAY;
            case FII               -> ALIQUOTA_FII;
            case TREASURY          -> new BigDecimal("15"); // mínima; detalhado por lote no futuro
            case BDR_ETF           -> ALIQUOTA_SWING;      // 15% sem isenção de 20k
            case STOCK_INT         -> ALIQUOTA_SWING;      // 15% sem isenção
        };
    }

    private boolean pertenceCategoria(Operacao o, IrDTO.Categoria cat) {
        return switch (cat) {
            case SWING_TRADE_ACAO -> o.getAssetType() == AssetType.STOCK && !o.isDayTrade();
            case DAY_TRADE_ACAO   -> o.getAssetType() == AssetType.STOCK &&  o.isDayTrade();
            case FII               -> o.getAssetType() == AssetType.FII;
            case TREASURY          -> o.getAssetType() == AssetType.TREASURY;
            case BDR_ETF           -> o.getAssetType() == AssetType.BDR || o.getAssetType() == AssetType.ETF;
            case STOCK_INT         -> o.getAssetType() == AssetType.STOCK_INT || o.getAssetType() == AssetType.ETF_INT;
        };
    }

    /** Calcula posição atual (custo médio) para todas as ops de um perfil. */
    public List<IrDTO.PosicaoAtual> posicoes(List<Operacao> ops) {
        Map<String, BigDecimal> qtd = new HashMap<>();
        Map<String, BigDecimal> med = new HashMap<>();
        Map<String, AssetType>  tipo = new HashMap<>();

        for (Operacao o : ops.stream()
                .sorted(Comparator.comparing(Operacao::getData).thenComparingLong(Operacao::getId))
                .toList()) {
            String k = o.getTicker();
            tipo.put(k, o.getAssetType());
            if (o.getTipo() == TipoOperacao.COMPRA) {
                BigDecimal q = qtd.getOrDefault(k, ZERO);
                BigDecimal m = med.getOrDefault(k, ZERO);
                BigDecimal nq = q.add(o.getQuantidade());
                med.put(k, nq.compareTo(ZERO) > 0
                        ? q.multiply(m).add(o.getQuantidade().multiply(o.getPreco()))
                                       .divide(nq, 6, RoundingMode.HALF_UP)
                        : ZERO);
                qtd.put(k, nq);
            } else {
                qtd.merge(k, o.getQuantidade().negate(), BigDecimal::add);
            }
        }

        return qtd.entrySet().stream()
                .filter(e -> e.getValue().compareTo(ZERO) > 0)
                .map(e -> {
                    BigDecimal q = e.getValue();
                    BigDecimal m = med.getOrDefault(e.getKey(), ZERO);
                    return new IrDTO.PosicaoAtual(e.getKey(), tipo.get(e.getKey()),
                            q.setScale(8, RoundingMode.HALF_UP),
                            m.setScale(6, RoundingMode.HALF_UP),
                            q.multiply(m).setScale(SCALE, RoundingMode.HALF_UP));
                })
                .sorted(Comparator.comparing(IrDTO.PosicaoAtual::ticker))
                .toList();
    }
}
