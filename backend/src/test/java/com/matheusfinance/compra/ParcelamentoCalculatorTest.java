package com.matheusfinance.compra;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ParcelamentoCalculator — Regra de Negócio de Parcelamento")
class ParcelamentoCalculatorTest {

    final ParcelamentoCalculator calc = new ParcelamentoCalculator();

    // Cartão: vencimento dia 10, fechamento dia 5

    @Test
    @DisplayName("Compra ANTES do fechamento → vence no próximo mês")
    void compraAntesDoFechamento_venceNoProximoMes() {
        // Compra em 03/jan (dia 3 < fechamento 5) → vence em 10/fev
        LocalDate dataCompra = LocalDate.of(2024, 1, 3);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 10, 5);
        assertThat(result).isEqualTo(LocalDate.of(2024, 2, 10));
    }

    @Test
    @DisplayName("Compra NO DIA do fechamento → vence no mês subsequente ao próximo")
    void compraNoDiaDoFechamento_venceNoSubsequente() {
        // Compra em 05/jan (dia 5 >= fechamento 5) → pula ciclo → vence em 10/mar
        LocalDate dataCompra = LocalDate.of(2024, 1, 5);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 10, 5);
        assertThat(result).isEqualTo(LocalDate.of(2024, 3, 10));
    }

    @Test
    @DisplayName("Compra APÓS o fechamento → vence no mês subsequente ao próximo")
    void compraAposDoFechamento_venceNoSubsequente() {
        // Compra em 20/jan (dia 20 >= fechamento 5) → vence em 10/mar
        LocalDate dataCompra = LocalDate.of(2024, 1, 20);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 10, 5);
        assertThat(result).isEqualTo(LocalDate.of(2024, 3, 10));
    }

    @Test
    @DisplayName("Compra em dezembro antes do fechamento → vence em janeiro do ano seguinte")
    void compraDezembro_venceEmJaneiroSeguinte() {
        LocalDate dataCompra = LocalDate.of(2024, 12, 1);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 10, 5);
        assertThat(result).isEqualTo(LocalDate.of(2025, 1, 10));
    }

    @Test
    @DisplayName("Compra em dezembro após o fechamento → vence em fevereiro do ano seguinte")
    void compraDezembro_aposDateFechamento_venceEmFevereiroSeguinte() {
        LocalDate dataCompra = LocalDate.of(2024, 12, 20);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 10, 5);
        assertThat(result).isEqualTo(LocalDate.of(2025, 2, 10));
    }

    @Test
    @DisplayName("Dia de vencimento inválido para o mês é ajustado ao último dia")
    void diaVencimentoAjustadoParaMesesCurtos() {
        // Vencimento dia 31, mas fevereiro tem 29 dias (2024 é bissexto)
        LocalDate dataCompra = LocalDate.of(2024, 1, 3);
        LocalDate result = calc.calcularPrimeiroVencimento(dataCompra, 31, 5);
        assertThat(result).isEqualTo(LocalDate.of(2024, 2, 29));
    }

    @ParameterizedTest(name = "Parcela {0} → {1}")
    @CsvSource({
        "1, 2024-02-10",
        "2, 2024-03-10",
        "3, 2024-04-10",
        "12, 2025-01-10"
    })
    @DisplayName("calcularVencimentoParcela gera datas corretas para cada número de parcela")
    void calcularVencimentoParcela_datasCorretas(int numero, String esperado) {
        LocalDate primVenc = LocalDate.of(2024, 2, 10);
        LocalDate result = calc.calcularVencimentoParcela(primVenc, numero);
        assertThat(result).isEqualTo(LocalDate.parse(esperado));
    }
}
