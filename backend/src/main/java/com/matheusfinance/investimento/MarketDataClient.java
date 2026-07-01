package com.matheusfinance.investimento;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class MarketDataClient {

    private final RestClient restClient;
    private final String token;
    private final int batchSize;

    @Autowired
    public MarketDataClient(BrapiProperties props) {
        this.restClient = RestClient.builder().baseUrl(props.baseUrl()).build();
        this.token = props.token();
        this.batchSize = props.batchSize();
    }

    /** Package-private constructor for tests — accepts a pre-built RestClient. */
    MarketDataClient(RestClient restClient, String token, int batchSize) {
        this.restClient = restClient;
        this.token = token;
        this.batchSize = batchSize;
    }

    /**
     * Fetches current market prices for the given tickers.
     * Splits into batches of {@code batchSize} to respect API plan limits.
     * On any error for a batch, that batch is skipped (fail-safe).
     */
    public Map<String, BigDecimal> fetchPrices(List<String> tickers) {
        if (tickers.isEmpty()) return Map.of();

        Map<String, BigDecimal> result = new java.util.HashMap<>();
        List<List<String>> batches = partition(tickers, batchSize);

        for (List<String> batch : batches) {
            result.putAll(fetchBatch(batch));
        }
        return result;
    }

    /** Busca dados fundamentalistas (P/VP, DY) para os tickers informados. */
    public Map<String, BrapiResponse.Quote> fetchFundamentals(List<String> tickers) {
        if (tickers.isEmpty()) return Map.of();
        Map<String, BrapiResponse.Quote> result = new java.util.HashMap<>();
        for (List<String> batch : partition(tickers, batchSize)) {
            result.putAll(fetchFundamentalsBatch(batch));
        }
        return result;
    }

    private Map<String, BrapiResponse.Quote> fetchFundamentalsBatch(List<String> tickers) {
        String symbols = String.join(",", tickers);
        try {
            BrapiResponse.Root response = restClient.get()
                    .uri(uri -> {
                        var b = uri.path("/quote/" + symbols).queryParam("fundamental", "true");
                        if (token != null && !token.isBlank()) b = b.queryParam("token", token);
                        return b.build();
                    })
                    .retrieve()
                    .body(BrapiResponse.Root.class);

            if (response == null || response.results() == null) return Map.of();
            return response.results().stream()
                    .collect(Collectors.toMap(q -> q.symbol().toUpperCase(), q -> q, (a, b) -> a));
        } catch (Exception e) {
            log.warn("Brapi fundamentals fetch failed for [{}]: {}", symbols, e.getMessage());
            return Map.of();
        }
    }

    private Map<String, BigDecimal> fetchBatch(List<String> tickers) {
        String symbols = String.join(",", tickers);
        log.debug("Fetching prices for: {}", symbols);
        try {
            BrapiResponse.Root response = restClient.get()
                    .uri(uri -> {
                        var b = uri.path("/quote/" + symbols).queryParam("fundamental", "false");
                        if (token != null && !token.isBlank()) {
                            b = b.queryParam("token", token);
                        }
                        return b.build();
                    })
                    .retrieve()
                    .body(BrapiResponse.Root.class);

            if (response == null || response.results() == null) return Map.of();

            return response.results().stream()
                    .filter(q -> q.regularMarketPrice() != null)
                    .collect(Collectors.toMap(
                            q -> q.symbol().toUpperCase(),
                            BrapiResponse.Quote::regularMarketPrice,
                            (a, b) -> a
                    ));
        } catch (Exception e) {
            log.warn("Brapi price fetch failed for [{}]: {}", symbols, e.getMessage());
            return Map.of();
        }
    }

    /**
     * Busca histórico de dividendos de ações via /api/quote/{ticker}?dividends=true.
     * Retorna lista vazia em caso de erro.
     */
    public List<BrapiResponse.CashDividend> fetchStockDividends(String ticker) {
        try {
            BrapiResponse.RootWithDividends response = restClient.get()
                    .uri(uri -> {
                        var b = uri.path("/quote/" + ticker).queryParam("dividends", "true");
                        if (token != null && !token.isBlank()) b = b.queryParam("token", token);
                        return b.build();
                    })
                    .retrieve()
                    .body(BrapiResponse.RootWithDividends.class);

            if (response == null || response.results() == null || response.results().isEmpty()) return List.of();
            var data = response.results().getFirst().dividendsData();
            if (data == null || data.cashDividends() == null) return List.of();
            return data.cashDividends();
        } catch (Exception e) {
            log.warn("Brapi stock dividends fetch failed for [{}]: {}", ticker, e.getMessage());
            return List.of();
        }
    }

    /**
     * Busca histórico de rendimentos de FIIs via /api/v2/fii/dividends?symbols=...
     * Retorna mapa ticker → lista de dividendos.
     */
    public Map<String, List<BrapiResponse.FiiDividend>> fetchFiiDividends(List<String> tickers) {
        if (tickers.isEmpty()) return Map.of();
        Map<String, List<BrapiResponse.FiiDividend>> result = new java.util.HashMap<>();
        RestClient fiiClient = RestClient.builder().baseUrl("https://brapi.dev/api/v2").build();

        for (List<String> batch : partition(tickers, batchSize)) {
            String symbols = String.join(",", batch);
            try {
                BrapiResponse.FiiDividendsRoot response = fiiClient.get()
                        .uri(uri -> {
                            var b = uri.path("/fii/dividends").queryParam("symbols", symbols);
                            if (token != null && !token.isBlank()) b = b.queryParam("token", token);
                            return b.build();
                        })
                        .retrieve()
                        .body(BrapiResponse.FiiDividendsRoot.class);

                if (response == null || response.dividends() == null) continue;
                response.dividends().forEach(d ->
                        result.computeIfAbsent(d.symbol().toUpperCase(), k -> new java.util.ArrayList<>()).add(d));
            } catch (Exception e) {
                log.warn("Brapi FII dividends fetch failed for [{}]: {}", symbols, e.getMessage());
            }
        }
        return result;
    }

    private static <T> List<List<T>> partition(List<T> list, int size) {
        List<List<T>> parts = new java.util.ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            parts.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return parts;
    }
}
