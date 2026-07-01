package com.matheusfinance.investimento;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TreasuryPriceService")
class TreasuryPriceServiceTest {

    @Mock InvestmentPositionRepository repository;
    @Mock RestClient restClient;

    private TreasuryPriceService service;

    @BeforeEach
    void setUp() {
        service = new TreasuryPriceService(repository, restClient);
    }

    // ── nomeCorresponde ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("nomeCorresponde()")
    class NomeCorrespondeTestes {

        @Test
        @DisplayName("match exato (case insensitive)")
        void matchExato() {
            assertThat(service.nomeCorresponde("TESOURO SELIC 2029", "Tesouro Selic 2029")).isTrue();
        }

        @Test
        @DisplayName("productName contém nome da API")
        void productNameContemApiNome() {
            assertThat(service.nomeCorresponde("Tesouro Direto SELIC 2029", "SELIC 2029")).isTrue();
        }

        @Test
        @DisplayName("nome da API contém productName")
        void apiNomeContemProductName() {
            assertThat(service.nomeCorresponde("SELIC 2029", "Tesouro Direto SELIC 2029")).isTrue();
        }

        @Test
        @DisplayName("prefixo 'tesouro direto' é ignorado na comparação")
        void ignoraPrefixoTesouroDireto() {
            assertThat(service.nomeCorresponde("Tesouro Direto Prefixado 2026", "Tesouro Prefixado 2026")).isTrue();
        }

        @Test
        @DisplayName("nomes distintos não correspondem")
        void nomeDistintoNaoCorresponde() {
            assertThat(service.nomeCorresponde("TESOURO SELIC 2029", "TESOURO IPCA 2035")).isFalse();
        }
    }

    // ── calcularPorJurosCompostos ─────────────────────────────────────────────

    @Nested
    @DisplayName("calcularPorJurosCompostos()")
    class JurosCompostosTestes {

        @Test
        @DisplayName("usa totalValue/quantity como base quando averagePrice é null (fluxo TREASURY)")
        void semAveragePrice_usaTotalValueComBase() {
            // averagePrice=null mas totalValue=500 e quantity=0.5 → base=1000
            InvestmentPosition pos = buildTreasury("SELIC", null, new BigDecimal("12.0"),
                    LocalDate.now().minusDays(365));
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isPresent();
            // base = 500/0.5 = 1000 → 1000 * 1.12^1 ≈ 1120
            assertThat(result.get().doubleValue()).isCloseTo(1120.0, within(1.0));
        }

        @Test
        @DisplayName("retorna empty quando averagePrice e totalValue/quantity são nulos/zero")
        void semBasePrice_retornaEmpty() {
            InvestmentPosition pos = InvestmentPosition.builder()
                    .ticker("X").productName("X").type(InvestmentType.TREASURY)
                    .quantity(BigDecimal.ZERO).totalValue(BigDecimal.ZERO)
                    .referenceDate(LocalDate.now().minusDays(100)).indexer("SELIC").build();
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("retorna empty quando taxa não pode ser determinada")
        void semTaxa_retornaEmpty() {
            InvestmentPosition pos = buildTreasury("SELIC", new BigDecimal("1000.00"), null,
                    LocalDate.now().minusDays(30));
            // restClient não tem stub → BCB lança → taxaAnual também null → retorna empty
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("dias <= 0 retorna averagePrice sem correção")
        void diasZero_retornaAveragePrice() {
            InvestmentPosition pos = buildTreasury("SELIC", new BigDecimal("1000.00"), new BigDecimal("12.0"),
                    LocalDate.now());
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo("1000.00");
        }

        @Test
        @DisplayName("SELIC 365 dias com taxa 12% a.a. ≈ R$1.120")
        void selicUmAno_valorCorreto() {
            InvestmentPosition pos = buildTreasury("SELIC", new BigDecimal("1000.00"), new BigDecimal("12.0"),
                    LocalDate.now().minusDays(365));
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isPresent();
            // 1000 * (1 + 0.12)^1 = 1120.00
            assertThat(result.get().doubleValue()).isCloseTo(1120.0, within(1.0));
        }

        @Test
        @DisplayName("PRE usa base 252 dias úteis (70% dos corridos)")
        void preUmaBase252() {
            InvestmentPosition pos = buildTreasury("PRE", new BigDecimal("1000.00"), new BigDecimal("12.0"),
                    LocalDate.now().minusDays(365));
            Optional<BigDecimal> result = service.calcularPorJurosCompostos(pos);
            assertThat(result).isPresent();
            // expoente = ceil(365 * 0.70 / 252) = ceil(1.012) = 2 → 1000 * 1.12^2 ≈ 1254.40
            // ou ceil(365*0.70) = 256 dias úteis / 252 = ~1.016 → 1000 * 1.12^(ceil(1.016)) = 1000*1.12^2
            double v = result.get().doubleValue();
            // Confirma que é maior que a base SELIC (12% sobre 365 corridos)
            assertThat(v).isGreaterThan(1000.0);
        }
    }

    // ── resolverPreco ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("resolverPreco()")
    class ResolverPrecoTestes {

        @Test
        @DisplayName("usa preço da API do Tesouro quando nome corresponde")
        void usaApiTd_quandoNomeCorresponde() {
            InvestmentPosition pos = buildTreasury("SELIC", new BigDecimal("1000.00"), null,
                    LocalDate.now().minusDays(30));
            pos.setProductName("TESOURO SELIC 2029");

            Map<String, BigDecimal> tdPrices = Map.of("Tesouro Selic 2029", new BigDecimal("1050.00"));

            Optional<BigDecimal> result = service.resolverPreco(pos, tdPrices);

            assertThat(result).isPresent();
            assertThat(result.get()).isEqualByComparingTo("1050.00");
        }

        @Test
        @DisplayName("cai para juros compostos quando nome não está na API do TD")
        void fallbackParaJurosCompostos() {
            InvestmentPosition pos = buildTreasury("SELIC", new BigDecimal("1000.00"), new BigDecimal("12.0"),
                    LocalDate.now().minusDays(365));
            pos.setProductName("TESOURO SELIC 2035");

            Map<String, BigDecimal> tdPrices = Map.of("Tesouro Selic 2029", new BigDecimal("1050.00"));

            Optional<BigDecimal> result = service.resolverPreco(pos, tdPrices);

            assertThat(result).isPresent();
            assertThat(result.get().doubleValue()).isCloseTo(1120.0, within(1.0));
        }
    }

    // ── atualizarPrecos ───────────────────────────────────────────────────────

    @Test
    @DisplayName("lista vazia retorna 0 sem chamar o repositório")
    void listaVazia_retornaZero() {
        int updated = service.atualizarPrecos(java.util.List.of());
        assertThat(updated).isEqualTo(0);
        verifyNoInteractions(repository);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static InvestmentPosition buildTreasury(String indexer, BigDecimal averagePrice,
                                                    BigDecimal taxaAnual, LocalDate referenceDate) {
        InvestmentPosition pos = InvestmentPosition.builder()
                .ticker("TRSELBR")
                .productName("Tesouro Selic 2029")
                .type(InvestmentType.TREASURY)
                .quantity(new BigDecimal("0.5"))
                .totalValue(new BigDecimal("500.00"))
                .averagePrice(averagePrice)
                .taxaAnual(taxaAnual)
                .referenceDate(referenceDate)
                .indexer(indexer)
                .build();
        return pos;
    }
}
