package com.matheusfinance.features.investimento;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

/**
 * Stateless P&L calculator. Uses BigDecimal throughout to preserve precision.
 */
@Component
public class PnlCalculator {

    public record PnlResult(
            BigDecimal investedValue,
            BigDecimal currentValue,
            BigDecimal nominalPnl,
            BigDecimal percentPnl
    ) {}

    /**
     * Returns empty when averagePrice or currentPrice is null (data not available).
     */
    public Optional<PnlResult> calculate(BigDecimal quantity,
                                         BigDecimal averagePrice,
                                         BigDecimal currentPrice) {
        if (quantity == null || averagePrice == null || currentPrice == null) {
            return Optional.empty();
        }

        BigDecimal invested = quantity.multiply(averagePrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal current  = quantity.multiply(currentPrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal nominal  = current.subtract(invested);

        BigDecimal percent = BigDecimal.ZERO;
        if (invested.compareTo(BigDecimal.ZERO) != 0) {
            percent = nominal
                    .divide(invested, 6, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return Optional.of(new PnlResult(invested, current, nominal, percent));
    }
}
