package com.matheusfinance.benchmark;

import com.matheusfinance.investimento.BrapiProperties;
import com.matheusfinance.patrimonio.PatrimonioDTO;
import com.matheusfinance.patrimonio.PatrimonioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BenchmarkService {

    private static final DateTimeFormatter BCB_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
    // 4392 = CDI diário (% ao dia), 433 = IPCA mensal (% ao mês)
    private static final int SERIE_CDI  = 4392;
    private static final int SERIE_IPCA = 433;

    private final PatrimonioService patrimonioService;
    private final BrapiProperties brapiProperties;
    private final RestClient restClient = RestClient.create();

    public BenchmarkDTO.Historico historico(Long perfilId, int meses) {
        PatrimonioDTO.Historico hist = patrimonioService.historico(perfilId, meses);
        List<PatrimonioDTO.PontoHistorico> pontos = hist.pontos();

        if (pontos.isEmpty()) return new BenchmarkDTO.Historico(null, List.of());

        LocalDate dataInicio = pontos.get(0).data();
        LocalDate dataFim    = pontos.get(pontos.size() - 1).data();

        Map<LocalDate, Double> cdiAcum  = fetchCdiAcumulado(dataInicio, dataFim);
        Map<LocalDate, Double> ipcaAcum = fetchIpcaAcumulado(dataInicio, dataFim);
        Map<LocalDate, Double> ibovAcum = fetchIbovAcumulado(dataInicio, dataFim);

        // Retorno normalizado da carteira: ((totalAtual[i] / totalAtual[0]) - 1) * 100
        double totalBase = pontos.get(0).totalAtual().doubleValue();

        List<BenchmarkDTO.Ponto> resultado = pontos.stream().map(p -> {
            String label = p.data().getDayOfMonth() + " "
                    + p.data().getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            Double carteira = totalBase > 0
                    ? ((p.totalAtual().doubleValue() / totalBase) - 1) * 100
                    : null;
            return new BenchmarkDTO.Ponto(
                    p.data(), label,
                    nearest(cdiAcum,  p.data()),
                    nearest(ipcaAcum, p.data()),
                    nearest(ibovAcum, p.data()),
                    carteira
            );
        }).toList();

        return new BenchmarkDTO.Historico(dataInicio, resultado);
    }

    // ── CDI ────────────────────────────────────────────────────────────────────

    private Map<LocalDate, Double> fetchCdiAcumulado(LocalDate inicio, LocalDate fim) {
        try {
            String url = BCB_BASE + "/" + SERIE_CDI + "/dados?formato=json"
                    + "&dataInicial=" + inicio.format(BCB_FMT)
                    + "&dataFinal="   + fim.format(BCB_FMT);

            BcbEntry[] entries = restClient.get().uri(url)
                    .retrieve().body(BcbEntry[].class);

            if (entries == null || entries.length == 0) return Map.of();

            Map<LocalDate, Double> acum = new LinkedHashMap<>();
            double fator = 1.0;
            LocalDate primeiroDia = parseBcbDate(entries[0].data());

            for (BcbEntry e : entries) {
                double taxaDiaria = Double.parseDouble(e.valor().replace(",", ".")) / 100.0;
                fator *= (1 + taxaDiaria);
                acum.put(parseBcbDate(e.data()), (fator - 1) * 100);
            }
            // ponto zero no dia inicial
            acum.put(primeiroDia, 0.0);
            return acum;
        } catch (Exception ex) {
            log.warn("Falha ao buscar CDI do BCB: {}", ex.getMessage());
            return Map.of();
        }
    }

    // ── IPCA ───────────────────────────────────────────────────────────────────

    private Map<LocalDate, Double> fetchIpcaAcumulado(LocalDate inicio, LocalDate fim) {
        try {
            String url = BCB_BASE + "/" + SERIE_IPCA + "/dados?formato=json"
                    + "&dataInicial=" + inicio.format(BCB_FMT)
                    + "&dataFinal="   + fim.format(BCB_FMT);

            BcbEntry[] entries = restClient.get().uri(url)
                    .retrieve().body(BcbEntry[].class);

            if (entries == null || entries.length == 0) return Map.of();

            Map<LocalDate, Double> acum = new LinkedHashMap<>();
            double fator = 1.0;

            for (BcbEntry e : entries) {
                double taxaMensal = Double.parseDouble(e.valor().replace(",", ".")) / 100.0;
                fator *= (1 + taxaMensal);
                // IPCA é mensal: associamos ao último dia do mês referenciado
                LocalDate ref = parseBcbDate(e.data());
                acum.put(ref, (fator - 1) * 100);
            }
            return acum;
        } catch (Exception ex) {
            log.warn("Falha ao buscar IPCA do BCB: {}", ex.getMessage());
            return Map.of();
        }
    }

    // ── IBOV (BOVA11 via Brapi) ────────────────────────────────────────────────

    private Map<LocalDate, Double> fetchIbovAcumulado(LocalDate inicio, LocalDate fim) {
        try {
            long meses = java.time.temporal.ChronoUnit.MONTHS.between(inicio, fim) + 1;
            String range = meses <= 1 ? "1mo" : meses <= 3 ? "3mo" : meses <= 6 ? "6mo" : meses <= 12 ? "1y" : "2y";

            String url = brapiProperties.baseUrl() + "/quote/BOVA11"
                    + "?range=" + range + "&interval=1d&fundamental=false"
                    + (brapiProperties.token() != null && !brapiProperties.token().isBlank()
                       ? "&token=" + brapiProperties.token() : "");

            BrapiHistorico resp = restClient.get().uri(url)
                    .retrieve().body(BrapiHistorico.class);

            if (resp == null || resp.results() == null || resp.results().isEmpty()) return Map.of();

            List<BrapiHistorico.QuoteResult> results = resp.results();
            List<BrapiHistorico.HistoricalPrice> hist = results.get(0).historicalDataPrice();
            if (hist == null || hist.isEmpty()) return Map.of();

            // Filtra a partir do dataInicio e calcula retorno relativo ao primeiro ponto
            List<BrapiHistorico.HistoricalPrice> filtrado = hist.stream()
                    .filter(h -> h.date() != null)
                    .filter(h -> {
                        LocalDate d = LocalDate.ofEpochDay(h.date() / 86400);
                        return !d.isBefore(inicio) && !d.isAfter(fim);
                    })
                    .sorted(Comparator.comparingLong(BrapiHistorico.HistoricalPrice::date))
                    .toList();

            if (filtrado.isEmpty()) return Map.of();

            double precoBase = filtrado.get(0).close();
            Map<LocalDate, Double> acum = new LinkedHashMap<>();
            for (BrapiHistorico.HistoricalPrice h : filtrado) {
                LocalDate d = LocalDate.ofEpochDay(h.date() / 86400);
                acum.put(d, ((h.close() / precoBase) - 1) * 100);
            }
            return acum;
        } catch (Exception ex) {
            log.warn("Falha ao buscar IBOV da Brapi: {}", ex.getMessage());
            return Map.of();
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private LocalDate parseBcbDate(String s) {
        return LocalDate.parse(s, BCB_FMT);
    }

    /** Retorna o valor mais próximo (anterior ou igual) a uma data no mapa. */
    private Double nearest(Map<LocalDate, Double> map, LocalDate target) {
        if (map.isEmpty()) return null;
        return map.entrySet().stream()
                .filter(e -> !e.getKey().isAfter(target))
                .max(Comparator.comparing(Map.Entry::getKey))
                .map(Map.Entry::getValue)
                .orElse(null);
    }

    // ── Tipos internos para parsing JSON ──────────────────────────────────────

    record BcbEntry(String data, String valor) {}

    record BrapiHistorico(List<BrapiHistorico.QuoteResult> results) {
        record QuoteResult(String symbol, List<HistoricalPrice> historicalDataPrice) {}
        record HistoricalPrice(Long date, double close) {}
    }
}
