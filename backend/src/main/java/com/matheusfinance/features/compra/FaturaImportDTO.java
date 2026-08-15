package com.matheusfinance.features.compra;

import java.time.LocalDate;

public class FaturaImportDTO {

    public record Resultado(
        int ano,
        int mes,
        int linhasImportadas,
        LocalDate vencimento
    ) {}
}
