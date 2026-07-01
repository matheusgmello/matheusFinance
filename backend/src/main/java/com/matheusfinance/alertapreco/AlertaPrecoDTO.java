package com.matheusfinance.alertapreco;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class AlertaPrecoDTO {

    public record Request(
        @NotBlank String ticker,
        @NotNull @DecimalMin("0.01") BigDecimal precoAlvo,
        @NotNull AlertaPreco.Direcao direcao
    ) {}

    public record Response(
        long id,
        String ticker,
        BigDecimal precoAlvo,
        AlertaPreco.Direcao direcao,
        boolean ativo,
        OffsetDateTime disparadoEm,
        OffsetDateTime criadoEm
    ) {}
}
