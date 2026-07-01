package com.matheusfinance.compra;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Calcula a data de vencimento da 1ª parcela segundo a regra do cartão:
 *
 * Se dataCompra.getDayOfMonth() >= diaFechamento do cartão,
 *   a 1ª parcela vence no SEGUNDO próximo mês de vencimento (pula um ciclo).
 * Caso contrário, vence no PRÓXIMO mês de vencimento.
 */
@Component
public class ParcelamentoCalculator {

    public LocalDate calcularPrimeiroVencimento(LocalDate dataCompra,
                                                 int diaVencimento,
                                                 int diaFechamento) {
        int diaCompra = dataCompra.getDayOfMonth();
        // Determina o mês base de vencimento: se já passou do fechamento, pula para o próximo ciclo
        LocalDate base = dataCompra.withDayOfMonth(1);
        if (diaCompra >= diaFechamento) {
            base = base.plusMonths(1);
        }

        // Avança para o próximo mês que tem o dia de vencimento
        base = base.plusMonths(1);
        int maxDay = YearMonth.from(base).lengthOfMonth();
        int dia = Math.min(diaVencimento, maxDay);
        return base.withDayOfMonth(dia);
    }

    public LocalDate calcularVencimentoParcela(LocalDate primeiroVencimento, int numeroParcela) {
        LocalDate base = primeiroVencimento.plusMonths(numeroParcela - 1L);
        int diaOriginal = primeiroVencimento.getDayOfMonth();
        int maxDay = YearMonth.from(base).lengthOfMonth();
        return base.withDayOfMonth(Math.min(diaOriginal, maxDay));
    }
}
