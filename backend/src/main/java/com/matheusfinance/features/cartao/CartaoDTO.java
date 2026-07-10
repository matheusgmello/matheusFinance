package com.matheusfinance.features.cartao;

import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;

public class CartaoDTO {

    public record Request(
        @NotBlank @Size(min = 2, max = 100) String nome,
        @NotNull @Min(1) @Max(31) Integer diaVencimento,
        @NotNull @Min(1) @Max(31) Integer diaFechamento
    ) {}

    public record Response(
        Long id,
        Long perfilId,
        String nome,
        Integer diaVencimento,
        Integer diaFechamento,
        OffsetDateTime criadoEm
    ) {}
}
