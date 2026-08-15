package com.matheusfinance.features.compra;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class ParcelamentoCalculatorTest {

    private final ParcelamentoCalculator calc = new ParcelamentoCalculator();

    @Test
    @DisplayName("compra antes do fechamento vence no mês seguinte")
    void antesDoFechamento() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 1, 10), 5, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2026, 2, 5));
    }

    @Test
    @DisplayName("compra depois do fechamento pula um ciclo")
    void depoisDoFechamento() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 1, 25), 5, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2026, 3, 5));
    }

    @Test
    @DisplayName("comprar exatamente no dia do fechamento já pula o ciclo")
    void noDiaDoFechamento() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 1, 20), 5, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2026, 3, 5));
    }

    @Test
    @DisplayName("véspera do fechamento ainda cai no ciclo curto")
    void vesperaDoFechamento() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 1, 19), 5, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2026, 2, 5));
    }

    @Test
    @DisplayName("vencimento dia 31 é ajustado em fevereiro")
    void ajustaMesCurto() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 1, 10), 31, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    @DisplayName("fevereiro de ano bissexto tem 29 dias")
    void anoBissexto() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2028, 1, 10), 31, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    @DisplayName("compra em dezembro vira o ano")
    void viradaDeAno() {
        LocalDate venc = calc.calcularPrimeiroVencimento(LocalDate.of(2026, 12, 25), 10, 20);
        assertThat(venc).isEqualTo(LocalDate.of(2027, 2, 10));
    }

    @Test
    @DisplayName("parcela 1 é o próprio primeiro vencimento")
    void primeiraParcela() {
        LocalDate primeiro = LocalDate.of(2026, 2, 5);
        assertThat(calc.calcularVencimentoParcela(primeiro, 1)).isEqualTo(primeiro);
    }

    @Test
    @DisplayName("parcelas avançam um mês por vez")
    void parcelasSequenciais() {
        LocalDate primeiro = LocalDate.of(2026, 2, 5);
        assertThat(calc.calcularVencimentoParcela(primeiro, 3)).isEqualTo(LocalDate.of(2026, 4, 5));
        assertThat(calc.calcularVencimentoParcela(primeiro, 12)).isEqualTo(LocalDate.of(2027, 1, 5));
    }

    @Test
    @DisplayName("dia 31 encolhe em fevereiro mas volta em março")
    void diaEncolheENaoPerde() {
        LocalDate primeiro = LocalDate.of(2026, 1, 31);
        assertThat(calc.calcularVencimentoParcela(primeiro, 2)).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(calc.calcularVencimentoParcela(primeiro, 3)).isEqualTo(LocalDate.of(2026, 3, 31));
    }
}
