package com.matheusfinance.features.recorrente;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class RecorrenteDTO {

    public record Request(
        @NotBlank @Size(max = 100) String empresa,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull @Min(1) @Max(31) Integer diaVencimento,
        String categoria
    ) {}

    public record Response(
        Long id,
        Long perfilId,
        String empresa,
        BigDecimal valor,
        Integer diaVencimento,
        String categoria,
        Boolean ativo,
        OffsetDateTime criadoEm
    ) {}

    public record ChecklistResponse(
        Long id,
        Long recorrenteId,
        String empresa,
        BigDecimal valor,
        Integer diaVencimento,
        Boolean pago,
        OffsetDateTime pagoEm
    ) {}

    public record MarcarPagoRequest(boolean pago) {}
}
