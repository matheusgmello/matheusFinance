package com.matheusfinance.ir;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class IrDTO {

    // ── Operações ──────────────────────────────────────────────────────────────

    public record OperacaoRequest(
        @NotBlank String ticker,
        @NotNull TipoOperacao tipo,
        @NotNull @DecimalMin("0.000001") BigDecimal quantidade,
        @NotNull @DecimalMin("0.000001") BigDecimal preco,
        @NotNull LocalDate data,
        boolean dayTrade,
        @NotNull AssetType assetType
    ) {}

    public record OperacaoResponse(
        Long id,
        String ticker,
        TipoOperacao tipo,
        BigDecimal quantidade,
        BigDecimal preco,
        BigDecimal totalOperacao,
        LocalDate data,
        boolean dayTrade,
        AssetType assetType
    ) {}

    // ── Apuração ───────────────────────────────────────────────────────────────

    public enum Categoria {
        SWING_TRADE_ACAO,
        DAY_TRADE_ACAO,
        FII,
        TREASURY,
        BDR_ETF,     // BDR e ETF nacional — 15% sem isenção de 20k
        STOCK_INT    // Ação/REIT/ETF internacional — 15% sem isenção
    }

    public record ApuracaoMensal(
        String mes,                   // "2026-04"
        Categoria categoria,
        BigDecimal totalVendido,      // R$ bruto vendido no mês
        BigDecimal custoVendido,      // custo médio das cotas vendidas
        BigDecimal resultadoBruto,    // totalVendido - custoVendido (positivo = lucro)
        BigDecimal prejuizoAnterior,  // saldo de prejuízo acumulado até o mês anterior
        BigDecimal baseCalculo,       // max(0, resultadoBruto - prejuizoAnterior)
        BigDecimal aliquota,          // % aplicada (ex: 15.00)
        BigDecimal impostoDevido,     // R$ a pagar (0 se isento ou prejuízo)
        boolean isento,               // swing trade com vendas ≤ 20k
        BigDecimal prejuizoGerado,    // prejuízo novo gerado neste mês (se resultadoBruto < 0)
        BigDecimal saldoPrejuizoFinal // saldo de prejuízo após este mês
    ) {}

    public record ResumoPorCategoria(
        Categoria categoria,
        List<ApuracaoMensal> meses,
        BigDecimal totalImpostoDevido,
        BigDecimal saldoPrejuizoAtual
    ) {}

    public record Apuracao(
        List<ResumoPorCategoria> categorias,
        BigDecimal totalImpostoAno    // soma de todos os impostos devidos no ano filtrado
    ) {}

    // ── Isentômetro ────────────────────────────────────────────────────────────

    public record Isentometro(
        String mes,                   // "2026-05"
        BigDecimal totalVendido,      // soma das vendas STOCK swing no mês
        BigDecimal limiteIsencao,     // 20000.00
        BigDecimal percentual,        // totalVendido / limiteIsencao * 100
        boolean isento                // totalVendido <= limiteIsencao
    ) {}

    // ── Posição atual (custo médio por ticker) ─────────────────────────────────

    public record PosicaoAtual(
        String ticker,
        AssetType assetType,
        BigDecimal quantidadeAtual,
        BigDecimal custoMedio,
        BigDecimal custoTotal
    ) {}
}
