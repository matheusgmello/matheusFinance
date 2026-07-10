package com.matheusfinance.features.dashboard;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDTO {

    public record ResumoMes(
        int ano,
        int mes,
        BigDecimal totalParcelas,
        BigDecimal totalRecorrentes,
        BigDecimal totalGeral,
        BigDecimal receita,
        BigDecimal saldo,
        List<CategoriaItem> categorias
    ) {}

    public record CategoriaItem(String categoria, BigDecimal valor) {}

    public record ProjecaoMes(
        int ano,
        int mes,
        String label,
        BigDecimal totalParcelas,
        BigDecimal totalRecorrentes,
        BigDecimal totalGeral
    ) {}

    public record PerfilResumo(
        long perfilId,
        String perfilNome,
        BigDecimal receita,
        BigDecimal totalGeral,
        BigDecimal saldo
    ) {}

    public record ConsolidadoMes(
        int ano,
        int mes,
        BigDecimal totalReceita,
        BigDecimal totalDespesas,
        BigDecimal totalSaldo,
        List<PerfilResumo> perfis
    ) {}
}
