package com.matheusfinance.features.alerta;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class AlertaDTO {

    public record ParcelaVencendo(
        Long parcelaId,
        String descricao,
        String cartao,
        int numeroParcela,
        int totalParcelas,
        BigDecimal valor,
        LocalDate dataVencimento,
        boolean vencida
    ) {}

    public record RecorrenteVencendo(
        Long id,
        String empresa,
        BigDecimal valor,
        int diaVencimento,
        LocalDate proximoVencimento
    ) {}

    public record Vencimentos(
        int totalItens,
        List<ParcelaVencendo> parcelas,
        List<RecorrenteVencendo> recorrentes
    ) {}
}
