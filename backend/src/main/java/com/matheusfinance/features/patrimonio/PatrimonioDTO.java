package com.matheusfinance.features.patrimonio;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PatrimonioDTO {

    public record PontoHistorico(
        LocalDate data,
        String label,
        BigDecimal totalInvestido,
        BigDecimal totalAtual,
        BigDecimal pnlNominal
    ) {}

    public record Historico(
        int meses,
        List<PontoHistorico> pontos
    ) {}
}
