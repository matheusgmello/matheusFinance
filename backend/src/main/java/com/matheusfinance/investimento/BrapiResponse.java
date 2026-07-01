package com.matheusfinance.investimento;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public class BrapiResponse {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Root(List<Quote> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Quote(
        String symbol,
        BigDecimal regularMarketPrice,
        BigDecimal priceToBook,   // P/VP — presente apenas com fundamental=true
        BigDecimal dividendYield  // DY anual % — presente apenas com fundamental=true
    ) {}

    // ── Dividends — Ações (/api/quote/{ticker}?dividends=true) ────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuoteWithDividends(
        String symbol,
        @JsonProperty("dividendsData") DividendsData dividendsData
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RootWithDividends(List<QuoteWithDividends> results) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DividendsData(
        @JsonProperty("cashDividends") List<CashDividend> cashDividends
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CashDividend(
        @JsonProperty("paymentDate")   String paymentDate,    // "2026-03-20T03:00:00.000Z"
        @JsonProperty("lastDatePrior") String lastDatePrior,  // data com
        @JsonProperty("rate")          BigDecimal rate,       // valor por cota/ação
        @JsonProperty("label")         String label           // "DIVIDENDO", "JCP"
    ) {}

    // ── Dividends — FIIs (/api/v2/fii/dividends?symbols=...) ──────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FiiDividendsRoot(
        @JsonProperty("dividends") List<FiiDividend> dividends
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FiiDividend(
        @JsonProperty("symbol")        String symbol,
        @JsonProperty("paymentDate")   String paymentDate,    // "2026-04-15 00:00:00+00"
        @JsonProperty("lastDatePrior") String lastDatePrior,
        @JsonProperty("rate")          BigDecimal rate,
        @JsonProperty("label")         String label           // "RENDIMENTO", "AMORTIZACAO"
    ) {}
}
