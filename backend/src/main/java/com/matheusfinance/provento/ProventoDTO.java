package com.matheusfinance.provento;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ProventoDTO {

    public record Request(
        @NotBlank String ticker,
        @NotNull TipoProvento tipo,
        @NotNull @DecimalMin("0.01") BigDecimal valor,
        @NotNull LocalDate dataPagamento,
        LocalDate dataCom
    ) {}

    public record Response(
        Long id,
        String ticker,
        TipoProvento tipo,
        BigDecimal valor,
        LocalDate dataPagamento,
        LocalDate dataCom
    ) {}

    public record ResumoPorTicker(
        String ticker,
        BigDecimal totalRecebido,
        BigDecimal yieldOnCost   // null se não houver posição importada
    ) {}

    public record ResumoPorMes(
        String mes,              // "2026-04"
        BigDecimal totalRecebido
    ) {}

    public record ResumoGeral(
        BigDecimal totalAllTime,
        BigDecimal mediaUltimos12Meses,
        List<ResumoPorMes> porMes,
        List<ResumoPorTicker> porTicker
    ) {}

    public record ProjecaoPorTicker(
        String ticker,
        BigDecimal mediaMensal,     // média dos últimos 12 meses
        BigDecimal projecaoAnual
    ) {}

    public record ProjecaoRenda(
        BigDecimal totalMensalProjetado,
        BigDecimal totalAnualProjetado,
        List<ProjecaoPorTicker> porTicker  // ordenado por mediaMensal desc
    ) {}

    public record CalendarioItem(
        Long id,
        String ticker,
        TipoProvento tipo,
        BigDecimal valor,
        LocalDate dataPagamento,
        boolean recebido   // dataPagamento < hoje
    ) {}

    public record CalendarioMes(
        String mes,         // "2026-05"
        String mesLabel,    // "Maio/2026"
        BigDecimal total,
        boolean passado,    // todos os itens já recebidos
        List<CalendarioItem> itens
    ) {}

    public record ImportResult(int imported, int skipped) {}
}
