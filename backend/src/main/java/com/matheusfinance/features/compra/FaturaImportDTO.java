package com.matheusfinance.features.compra;

import java.time.LocalDate;

public class FaturaImportDTO {

    public record Resultado(
        int linhasImportadas,
        LocalDate vencimento
    ) {}
}
