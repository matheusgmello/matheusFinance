package com.matheusfinance.investimento;

import com.matheusfinance.alertapreco.AlertaPrecoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PriceUpdateService")
class PriceUpdateServiceTest {

    @Mock InvestmentPositionRepository repository;
    @Mock MarketDataClient marketDataClient;
    @Mock AlertaPrecoService alertaPrecoService;
    @Mock TreasuryPriceService treasuryPriceService;

    private PriceUpdateService service;

    @BeforeEach
    void setUp() {
        service = new PriceUpdateService(repository, marketDataClient, alertaPrecoService, treasuryPriceService);
    }

    @Test
    @DisplayName("portfólio vazio não chama a API Brapi")
    void emptyPortfolio_doesNotCallApi() {
        when(repository.findAllByTypeIn(anyList())).thenReturn(List.of());

        int updated = service.updateAllPrices();

        assertThat(updated).isEqualTo(0);
        verifyNoInteractions(marketDataClient);
    }

    @Test
    @DisplayName("busca apenas posições STOCK e FII (sem Tesouro Direto)")
    void onlyFetchesStockAndFii() {
        when(repository.findAllByTypeIn(anyList())).thenReturn(List.of());

        service.updateAllPrices();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<InvestmentType>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).findAllByTypeIn(captor.capture());
        assertThat(captor.getValue()).containsExactlyInAnyOrder(InvestmentType.STOCK, InvestmentType.FII);
        assertThat(captor.getValue()).doesNotContain(InvestmentType.TREASURY);
    }

    @Test
    @DisplayName("atualiza currentPrice e lastPriceUpdate quando Brapi retorna preço")
    void updatesCurrentPriceAndTimestamp() {
        InvestmentPosition pos = buildPosition("PETR4", InvestmentType.STOCK);
        when(repository.findAllByTypeIn(anyList())).thenReturn(List.of(pos));
        when(marketDataClient.fetchPrices(anyList())).thenReturn(Map.of("PETR4", new BigDecimal("38.50")));

        int updated = service.updateAllPrices();

        assertThat(updated).isEqualTo(1);
        assertThat(pos.getCurrentPrice()).isEqualByComparingTo("38.50");
        assertThat(pos.getLastPriceUpdate()).isNotNull();
        verify(repository).saveAll(anyList());
    }

    @Test
    @DisplayName("posição sem preço retornado pela Brapi não é atualizada")
    void missingTickerInResponse_notUpdated() {
        InvestmentPosition pos = buildPosition("UNKNOWN99", InvestmentType.STOCK);
        when(repository.findAllByTypeIn(anyList())).thenReturn(List.of(pos));
        when(marketDataClient.fetchPrices(anyList())).thenReturn(Map.of()); // Brapi não encontrou

        int updated = service.updateAllPrices();

        assertThat(updated).isEqualTo(0);
        assertThat(pos.getCurrentPrice()).isNull();
        verify(repository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("atualização parcial: 1 ticker encontrado, 1 não encontrado")
    void partialUpdate() {
        InvestmentPosition p1 = buildPosition("PETR4", InvestmentType.STOCK);
        InvestmentPosition p2 = buildPosition("UNKNOWN", InvestmentType.FII);
        when(repository.findAllByTypeIn(anyList())).thenReturn(List.of(p1, p2));
        when(marketDataClient.fetchPrices(anyList()))
                .thenReturn(Map.of("PETR4", new BigDecimal("38.50")));

        int updated = service.updateAllPrices();

        assertThat(updated).isEqualTo(1);
        assertThat(p1.getCurrentPrice()).isEqualByComparingTo("38.50");
        assertThat(p2.getCurrentPrice()).isNull();
        verify(repository).saveAll(anyList());
    }

    private static InvestmentPosition buildPosition(String ticker, InvestmentType type) {
        return InvestmentPosition.builder()
                .ticker(ticker)
                .productName(ticker)
                .type(type)
                .quantity(BigDecimal.TEN)
                .totalValue(new BigDecimal("1000.00"))
                .build();
    }
}
