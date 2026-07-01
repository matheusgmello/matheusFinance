package com.matheusfinance.investimento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class InvestmentDTO {

    public record ParsedPosition(
        String ticker,
        String productName,
        InvestmentType type,
        BigDecimal quantity,
        BigDecimal currentPrice,
        BigDecimal totalValue,
        String institution,
        LocalDate maturityDate,
        String indexer,
        BigDecimal taxaAnual
    ) {}

    public record ImportResult(int imported, int skipped) {}

    public record PositionResponse(
        Long id,
        String ticker,
        String productName,
        InvestmentType type,
        BigDecimal quantity,
        BigDecimal averagePrice,
        BigDecimal currentPrice,
        BigDecimal totalValue,
        String institution,
        LocalDate maturityDate,
        String indexer,
        LocalDate referenceDate,
        BigDecimal taxaAnual,
        // P&L — null when averagePrice or currentPrice unavailable
        BigDecimal investedValue,
        BigDecimal currentValue,
        BigDecimal pnlNominal,
        BigDecimal pnlPercent,
        OffsetDateTime lastPriceUpdate
    ) {}

    public record SummaryResponse(
        BigDecimal totalStocks,
        BigDecimal totalFiis,
        BigDecimal totalTreasury,
        BigDecimal grandTotal,
        List<PositionResponse> positions
    ) {}
}
