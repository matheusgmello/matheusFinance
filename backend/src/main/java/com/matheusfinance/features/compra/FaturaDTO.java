package com.matheusfinance.features.compra;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class FaturaDTO {

    public record Fatura(
        int ano,
        int mes,
        BigDecimal totalGeral,
        BigDecimal totalPago,
        List<FaturaCartao> cartoes
    ) {}

    public record FaturaCartao(
        Long cartaoId,
        String cartaoNome,
        int diaVencimento,
        BigDecimal total,
        BigDecimal totalPago,
        List<FaturaItem> itens
    ) {}

    public record FaturaItem(
        Long parcelaId,
        String descricao,
        String categoria,
        int numeroParcela,
        int totalParcelas,
        BigDecimal valor,
        LocalDate dataVencimento,
        boolean paga
    ) {}
}
