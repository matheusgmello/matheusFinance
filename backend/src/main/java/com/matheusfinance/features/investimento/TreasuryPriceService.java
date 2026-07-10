package com.matheusfinance.features.investimento;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Atualiza o preço atual (currentPrice) de posições do Tesouro Direto.
 *
 * Estratégia em ordem de preferência:
 *  1. API pública do Tesouro Nacional — preço real de resgate do dia
 *  2. Estimativa por juros compostos com taxa do Banco Central (SELIC/IPCA)
 *  3. Estimativa por juros compostos com taxaAnual gravada no import
 *
 * A estimativa é uma aproximação declarada — o preço via API do TD tem sempre precedência.
 */
@Slf4j
@Service
public class TreasuryPriceService {

    static final String TD_URL =
            "https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybond.json";
    static final String BCB_SELIC_URL =
            "https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json";
    static final String BCB_IPCA_URL =
            "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json";

    private final InvestmentPositionRepository repository;
    private final RestClient restClient;

    @Autowired
    public TreasuryPriceService(InvestmentPositionRepository repository) {
        this.repository = repository;
        this.restClient = RestClient.create();
    }

    /** Construtor para testes — aceita RestClient já configurado. */
    TreasuryPriceService(InvestmentPositionRepository repository, RestClient restClient) {
        this.repository = repository;
        this.restClient = restClient;
    }

    /**
     * Atualiza currentPrice de todas as posições TREASURY fornecidas.
     *
     * @return número de posições efetivamente atualizadas
     */
    public int atualizarPrecos(List<InvestmentPosition> treasuries) {
        if (treasuries.isEmpty()) return 0;

        Map<String, BigDecimal> tdPrices = fetchTdApiPrices();
        int updated = 0;

        for (InvestmentPosition pos : treasuries) {
            Optional<BigDecimal> preco = resolverPreco(pos, tdPrices);
            if (preco.isPresent()) {
                pos.setCurrentPrice(preco.get());
                pos.setLastPriceUpdate(OffsetDateTime.now());
                repository.save(pos);
                updated++;
                log.debug("Tesouro atualizado: {} → {}", pos.getProductName(), preco.get());
            } else {
                log.warn("Não foi possível precificar: {}", pos.getProductName());
            }
        }

        return updated;
    }

    // ── Resolução de preço ────────────────────────────────────────────────────

    Optional<BigDecimal> resolverPreco(InvestmentPosition pos, Map<String, BigDecimal> tdPrices) {
        // 1. API do Tesouro Direto
        Optional<BigDecimal> tdPreco = tdPrices.entrySet().stream()
                .filter(e -> nomeCorresponde(pos.getProductName(), e.getKey()))
                .map(Map.Entry::getValue)
                .findFirst();

        if (tdPreco.isPresent()) return tdPreco;

        // 2 e 3. Juros compostos — prefere taxa BCB, cai para taxaAnual gravada
        return calcularPorJurosCompostos(pos);
    }

    Optional<BigDecimal> calcularPorJurosCompostos(InvestmentPosition pos) {
        // Para TREASURY, averagePrice é null — usa totalValue/quantity como base
        BigDecimal basePrice;
        if (pos.getAveragePrice() != null && pos.getAveragePrice().compareTo(BigDecimal.ZERO) > 0) {
            basePrice = pos.getAveragePrice();
        } else if (pos.getTotalValue() != null && pos.getQuantity() != null
                && pos.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            basePrice = pos.getTotalValue().divide(pos.getQuantity(), 10, RoundingMode.HALF_UP);
        } else {
            return Optional.empty();
        }

        BigDecimal taxa = resolverTaxa(pos);
        if (taxa == null) return Optional.empty();

        long diasCorridos = ChronoUnit.DAYS.between(pos.getReferenceDate(), LocalDate.now());
        if (diasCorridos <= 0) return Optional.of(basePrice);

        // SELIC/IPCA: base 365 dias corridos; PRE: 70% dos dias corridos como proxy de úteis (base 252)
        double expoente = isPre(pos.getIndexer())
                ? (diasCorridos * 0.70) / 252.0
                : diasCorridos / 365.0;

        BigDecimal fator = BigDecimal.ONE
                .add(taxa.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                .pow((int) Math.ceil(expoente), new MathContext(10, RoundingMode.HALF_UP));

        return Optional.of(basePrice.multiply(fator).setScale(2, RoundingMode.HALF_UP));
    }

    private BigDecimal resolverTaxa(InvestmentPosition pos) {
        // Tenta BCB primeiro (taxa de mercado atual)
        try {
            return fetchTaxaBCB(pos.getIndexer());
        } catch (Exception e) {
            log.debug("BCB indisponível para indexador '{}', usando taxaAnual gravada", pos.getIndexer());
        }
        return pos.getTaxaAnual();
    }

    // ── Correspondência de nomes ──────────────────────────────────────────────

    /**
     * Normaliza ambos os nomes (lowercase, sem prefixo "tesouro") e compara.
     * Ex.: "TESOURO SELIC 2029" bate com "Tesouro Selic 2029" da API do TD.
     */
    boolean nomeCorresponde(String productName, String apiNm) {
        String a = normalizar(productName);
        String b = normalizar(apiNm);
        return a.equals(b) || a.contains(b) || b.contains(a);
    }

    private String normalizar(String s) {
        return s.trim().toLowerCase()
                .replace("tesouro direto", "")
                .replace("tesouro", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private boolean isPre(String indexer) {
        return indexer != null && (indexer.toUpperCase().startsWith("PRE")
                || indexer.toUpperCase().contains("PREFIXADO"));
    }

    // ── Chamadas externas ─────────────────────────────────────────────────────

    Map<String, BigDecimal> fetchTdApiPrices() {
        try {
            TdRoot root = restClient.get().uri(TD_URL)
                    .retrieve().body(TdRoot.class);
            if (root == null || root.response() == null || root.response().list() == null) {
                return Map.of();
            }
            return root.response().list().stream()
                    .filter(item -> item.bond() != null && item.bond().name() != null
                            && item.bond().unitPrice() != null)
                    .collect(Collectors.toMap(
                            item -> item.bond().name(),
                            item -> item.bond().unitPrice(),
                            (a, b) -> a));
        } catch (Exception e) {
            log.warn("API Tesouro Direto indisponível: {}", e.getMessage());
            return Map.of();
        }
    }

    BigDecimal fetchTaxaBCB(String indexer) {
        if (indexer == null) throw new IllegalArgumentException("indexer nulo");
        String url = indexer.toUpperCase().contains("IPCA") ? BCB_IPCA_URL : BCB_SELIC_URL;
        BcbEntry[] entries = restClient.get().uri(url).retrieve().body(BcbEntry[].class);
        if (entries == null || entries.length == 0) throw new IllegalStateException("BCB sem dados");

        double valor = Double.parseDouble(entries[0].valor().replace(",", "."));

        // SELIC retorna taxa diária — converter para anual (base 252 dias úteis)
        // IPCA retorna acumulado 12 meses — já é a taxa anual
        return indexer.toUpperCase().contains("IPCA")
                ? BigDecimal.valueOf(valor)
                : BigDecimal.valueOf(valor * 252).setScale(4, RoundingMode.HALF_UP);
    }

    // ── DTOs de deserialização das APIs externas ──────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TdRoot(TdResponse response) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TdResponse(@JsonProperty("TrsrBdTradgList") List<TdItem> list) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TdItem(@JsonProperty("TrsrBd") TdBond bond) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record TdBond(
            @JsonProperty("nm") String name,
            @JsonProperty("untrRedVal") BigDecimal unitPrice
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BcbEntry(String data, String valor) {}
}
