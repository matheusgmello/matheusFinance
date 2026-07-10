package com.matheusfinance.features.benchmark;

import java.time.LocalDate;
import java.util.List;

public class BenchmarkDTO {

    public record Ponto(
        LocalDate data,
        String label,
        Double cdi,      // % acumulado desde dataInicio (null se indisponível)
        Double ipca,
        Double ibov,
        Double carteira  // % retorno da carteira desde dataInicio (null se sem snapshot)
    ) {}

    public record Historico(
        LocalDate dataInicio,
        List<Ponto> pontos
    ) {}
}
