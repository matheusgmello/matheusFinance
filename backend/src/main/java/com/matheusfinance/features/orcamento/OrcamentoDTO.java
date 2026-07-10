package com.matheusfinance.features.orcamento;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class OrcamentoDTO {

    public record Request(
        @NotBlank String categoria,
        @NotNull @DecimalMin("0.01") BigDecimal valorLimite
    ) {}

    public record Response(
        Long id,
        String categoria,
        BigDecimal valorLimite,
        BigDecimal gastoAtual,
        BigDecimal percentual
    ) {}
}
