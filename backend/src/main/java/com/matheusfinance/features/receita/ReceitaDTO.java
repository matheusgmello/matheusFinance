package com.matheusfinance.features.receita;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ReceitaDTO {

    public record Request(
        @NotNull @DecimalMin("0.00") BigDecimal valor
    ) {}

    public record Response(int ano, int mes, BigDecimal valor) {}
}
