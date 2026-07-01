package com.matheusfinance.investimento;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FiiMetricaService {

    private final InvestmentPositionRepository repository;
    private final MarketDataClient marketDataClient;

    public List<FiiMetricaDTO.Metrica> metricas(Long perfilId) {
        List<String> tickers = repository
                .findAllByPerfilIdAndTypeIn(perfilId, List.of(InvestmentType.FII))
                .stream()
                .map(InvestmentPosition::getTicker)
                .distinct()
                .toList();

        if (tickers.isEmpty()) return List.of();

        Map<String, BrapiResponse.Quote> fundamentals = marketDataClient.fetchFundamentals(tickers);

        return tickers.stream()
                .map(ticker -> {
                    BrapiResponse.Quote q = fundamentals.get(ticker.toUpperCase());
                    return new FiiMetricaDTO.Metrica(
                            ticker,
                            q != null ? q.priceToBook() : null,
                            q != null ? q.dividendYield() : null
                    );
                })
                .toList();
    }
}
