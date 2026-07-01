package com.matheusfinance.investimento;

import java.math.BigDecimal;

public class FiiMetricaDTO {

    public record Metrica(
        String ticker,
        BigDecimal pvp,          // Preço / Valor Patrimonial
        BigDecimal dividendYield // DY anual %
    ) {}
}
