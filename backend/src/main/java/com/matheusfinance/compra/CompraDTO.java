package com.matheusfinance.compra;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class CompraDTO {

    public record Request(
        @NotNull Long cartaoId,
        @NotBlank @Size(max = 255) String descricao,
        @NotNull @DecimalMin("0.01") BigDecimal valorTotal,
        @NotNull @Min(1) @Max(360) Integer numParcelas,
        @NotNull LocalDate dataCompra,
        String categoria
    ) {}

    public record Response(
        Long id,
        Long perfilId,
        Long cartaoId,
        String cartaoNome,
        String descricao,
        BigDecimal valorTotal,
        Integer numParcelas,
        LocalDate dataCompra,
        String categoria,
        OffsetDateTime criadoEm,
        List<ParcelaResponse> parcelas
    ) {}

    public record ParcelaResponse(
        Long id,
        Integer numero,
        BigDecimal valor,
        LocalDate dataVencimento,
        Boolean paga,
        OffsetDateTime pagaEm
    ) {}
}
