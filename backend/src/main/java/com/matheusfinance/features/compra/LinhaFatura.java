package com.matheusfinance.features.compra;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Representação de uma linha de fatura já convertida, agnóstica do banco de origem.
 * Cada parser (Nubank, Itaú, ...) converte seu formato para isto na fronteira.
 */
public record LinhaFatura(LocalDate data, String descricao, BigDecimal valor) {}
