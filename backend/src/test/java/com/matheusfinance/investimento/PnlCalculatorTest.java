package com.matheusfinance.investimento;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PnlCalculator")
class PnlCalculatorTest {

    private final PnlCalculator calc = new PnlCalculator();

    @Test
    @DisplayName("calcula P&L positivo corretamente com arredondamento HALF_UP")
    void positivePnl() {
        // 100 ações, PM = R$ 30,00, preço atual = R$ 45,78
        // investido = 3.000,00 | atual = 4.578,00 | nominal = 1.578,00 | % = 52,60
        var result = calc.calculate(bd("100"), bd("30.00"), bd("45.78"));

        assertThat(result).isPresent();
        var pnl = result.get();
        assertThat(pnl.investedValue()).isEqualByComparingTo("3000.00");
        assertThat(pnl.currentValue()).isEqualByComparingTo("4578.00");
        assertThat(pnl.nominalPnl()).isEqualByComparingTo("1578.00");
        assertThat(pnl.percentPnl()).isEqualByComparingTo("52.60");
    }

    @Test
    @DisplayName("calcula P&L negativo (prejuízo)")
    void negativePnl() {
        // 50 ações, PM = R$ 50,00, preço atual = R$ 40,00
        // investido = 2.500,00 | nominal = -500,00 | % = -20,00
        var result = calc.calculate(bd("50"), bd("50.00"), bd("40.00"));

        assertThat(result).isPresent();
        var pnl = result.get();
        assertThat(pnl.nominalPnl()).isEqualByComparingTo("-500.00");
        assertThat(pnl.percentPnl()).isEqualByComparingTo("-20.00");
    }

    @Test
    @DisplayName("retorna vazio quando averagePrice é null")
    void nullAveragePrice_returnsEmpty() {
        assertThat(calc.calculate(bd("100"), null, bd("45.00"))).isEmpty();
    }

    @Test
    @DisplayName("retorna vazio quando currentPrice é null")
    void nullCurrentPrice_returnsEmpty() {
        assertThat(calc.calculate(bd("100"), bd("30.00"), null)).isEmpty();
    }

    @Test
    @DisplayName("retorna vazio quando quantity é null")
    void nullQuantity_returnsEmpty() {
        assertThat(calc.calculate(null, bd("30.00"), bd("45.00"))).isEmpty();
    }

    @Test
    @DisplayName("percentPnl é zero quando investedValue é zero (evita divisão por zero)")
    void zeroInvestedValue_percentIsZero() {
        var result = calc.calculate(bd("100"), bd("0.00"), bd("10.00"));

        assertThat(result).isPresent();
        assertThat(result.get().percentPnl()).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("suporta quantidade fracionária (Tesouro Direto: ex 1.07)")
    void fractionalQuantity() {
        // 1,07 títulos, PM = R$ 10.000,00, preço atual = R$ 11.000,00
        // investido = 10.700,00 | atual = 11.770,00 | nominal = 1.070,00 | % ≈ 10,00
        var result = calc.calculate(bd("1.07"), bd("10000.00"), bd("11000.00"));

        assertThat(result).isPresent();
        assertThat(result.get().investedValue()).isEqualByComparingTo("10700.00");
        assertThat(result.get().currentValue()).isEqualByComparingTo("11770.00");
        assertThat(result.get().percentPnl()).isEqualByComparingTo("10.00");
    }

    private static BigDecimal bd(String val) {
        return new BigDecimal(val);
    }
}
