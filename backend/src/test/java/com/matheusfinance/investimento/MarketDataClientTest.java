package com.matheusfinance.investimento;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

@DisplayName("MarketDataClient")
class MarketDataClientTest {

    private static final String BASE_URL = "https://brapi.dev/api";

    private MockRestServiceServer server;
    private MarketDataClient client;

    @BeforeEach
    void setUp() {
        RestTemplate template = new RestTemplate();
        server = MockRestServiceServer.createServer(template);
        // Use package-private constructor — RestClient.create(template) delegates to mock
        client = new MarketDataClient(RestClient.create(template), "", 10);
    }

    @Test
    @DisplayName("parseia resposta Brapi e retorna mapa ticker→preço")
    void parsesResponseCorrectly() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/quote/PETR4,BBAS3")))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(brapiJson(), MediaType.APPLICATION_JSON));

        Map<String, BigDecimal> prices = client.fetchPrices(List.of("PETR4", "BBAS3"));

        assertThat(prices).containsKey("PETR4");
        assertThat(prices).containsKey("BBAS3");
        assertThat(prices.get("PETR4")).isEqualByComparingTo("38.50");
        assertThat(prices.get("BBAS3")).isEqualByComparingTo("45.78");
        server.verify();
    }

    @Test
    @DisplayName("lista vazia não faz chamada HTTP e retorna mapa vazio")
    void emptyTickers_noHttpCall() {
        Map<String, BigDecimal> prices = client.fetchPrices(List.of());

        assertThat(prices).isEmpty();
        server.verify(); // verifica que nenhuma chamada foi feita
    }

    @Test
    @DisplayName("erro HTTP retorna mapa vazio sem lançar exceção")
    void httpError_returnsEmptyMap() {
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/quote/")))
                .andRespond(withServerError());

        Map<String, BigDecimal> prices = client.fetchPrices(List.of("PETR4"));

        assertThat(prices).isEmpty();
        server.verify();
    }

    @Test
    @DisplayName("ignora resultados com regularMarketPrice null")
    void nullPrice_isIgnored() {
        String json = """
                {"results":[
                  {"symbol":"PETR4","regularMarketPrice":38.50},
                  {"symbol":"INVALID","regularMarketPrice":null}
                ]}
                """;
        server.expect(requestTo(org.hamcrest.Matchers.containsString("/quote/")))
                .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        Map<String, BigDecimal> prices = client.fetchPrices(List.of("PETR4", "INVALID"));

        assertThat(prices).containsOnlyKeys("PETR4");
    }

    private static String brapiJson() {
        return """
                {"results":[
                  {"symbol":"PETR4","regularMarketPrice":38.50,"regularMarketChange":0.23},
                  {"symbol":"BBAS3","regularMarketPrice":45.78,"regularMarketChange":-0.10}
                ],"requestedAt":"2026-04-23T14:00:00Z","took":"12ms"}
                """;
    }
}
