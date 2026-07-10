package com.matheusfinance.features.rebalanceamento;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class RebalanceamentoDTO {

    public record AlvoRequest(
        @NotBlank String label,
        @NotNull TipoAlvo tipo,
        @NotNull @DecimalMin("0.01") @DecimalMax("100") BigDecimal percentualAlvo
    ) {}

    public record AlvoResponse(
        Long id,
        String label,
        TipoAlvo tipo,
        BigDecimal percentualAlvo
    ) {}

    public record ItemCalculo(
        String label,
        TipoAlvo tipo,
        BigDecimal percentualAlvo,   // % definido pelo usuário
        BigDecimal valorAtual,       // R$ atual na carteira
        BigDecimal percentualAtual,  // % atual na carteira
        BigDecimal diferencaValor,   // R$ faltando (negativo = sobra)
        BigDecimal diferencaPercent, // % faltando
        BigDecimal sugestaoAporte    // R$ sugerido para aportar neste item (≥ 0)
    ) {}

    public record Calculo(
        BigDecimal totalCarteira,
        BigDecimal totalAlvos,       // soma dos % definidos (ideal = 100)
        List<ItemCalculo> itens,
        BigDecimal aporteDesejado,   // input do usuário (pode ser null)
        BigDecimal aporteTotal       // soma das sugestões (≤ aporteDesejado)
    ) {}
}
