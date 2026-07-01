package com.matheusfinance.meta;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class MetaDTO {

    public record Request(
        @NotBlank String nome,
        @NotNull @DecimalMin("0.01") BigDecimal valorAlvo,
        BigDecimal valorAtual,
        LocalDate prazo
    ) {}

    public record AporteRequest(
        @NotNull @DecimalMin("0.01") BigDecimal valor
    ) {}

    public record Response(
        long id,
        String nome,
        BigDecimal valorAlvo,
        BigDecimal valorAtual,
        BigDecimal faltam,
        double percentual,
        LocalDate prazo,
        LocalDate previsaoConclusao
    ) {}
}
