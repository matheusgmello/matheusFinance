package com.matheusfinance.investimento;

import com.matheusfinance.alertapreco.AlertaPrecoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceUpdateService {

    private final InvestmentPositionRepository repository;
    private final MarketDataClient marketDataClient;
    private final AlertaPrecoService alertaPrecoService;
    private final TreasuryPriceService treasuryPriceService;

    /**
     * Atualiza preços de todas as posições STOCK e FII de todos os perfis.
     * Executa a cada 15 minutos durante o horário de pregão (seg–sex 10h–17h).
     * Retorna o número de posições atualizadas.
     */
    /** Job agendado — atualiza todos os perfis (chamado pelo scheduler, não pelo usuário). */
    @Scheduled(cron = "${app.price-update.cron:0 0/15 10-17 * * MON-FRI}")
    @Transactional
    public int updateAllPrices() {
        return updatePrices(null);
    }

    /** Atualização manual — restringe ao perfil do usuário autenticado quando perfilId != null. */
    @Transactional
    public int updatePrices(Long perfilId) {
        // Tipos com cotação na Brapi (mercado B3 + BDRs + ETFs nacionais)
        var brapiTypes = List.of(InvestmentType.STOCK, InvestmentType.FII,
                                  InvestmentType.BDR, InvestmentType.ETF);
        List<InvestmentPosition> positions = perfilId != null
                ? repository.findAllByPerfilIdAndTypeIn(perfilId, brapiTypes)
                : repository.findAllByTypeIn(brapiTypes);

        if (positions.isEmpty()) {
            log.debug("Nenhuma posição para atualizar preço.");
            return 0;
        }

        List<String> tickers = positions.stream()
                .map(InvestmentPosition::getTicker)
                .distinct()
                .toList();

        Map<String, BigDecimal> prices = marketDataClient.fetchPrices(tickers);
        if (prices.isEmpty()) {
            log.warn("Brapi não retornou preços — nenhuma posição atualizada.");
            return 0;
        }

        OffsetDateTime now = OffsetDateTime.now();
        int updated = 0;
        for (InvestmentPosition pos : positions) {
            BigDecimal price = prices.get(pos.getTicker().toUpperCase());
            if (price != null) {
                pos.setCurrentPrice(price);
                pos.setLastPriceUpdate(now);
                updated++;
            }
        }

        if (updated > 0) {
            repository.saveAll(positions);
            log.info("Preços atualizados: {}/{} posições STOCK/FII", updated, positions.size());
            prices.forEach((ticker, preco) -> alertaPrecoService.verificarAlertas(ticker, preco));
        }

        // Tesouro Direto — estratégia própria via API do TD + estimativa BCB
        List<InvestmentPosition> treasuries = perfilId != null
                ? repository.findAllByPerfilIdAndTypeIn(perfilId, List.of(InvestmentType.TREASURY))
                : repository.findAllByTypeIn(List.of(InvestmentType.TREASURY));
        // RENDA_FIXA, ETF_INT e STOCK_INT não têm atualização automática de preço
        int updatedTreasury = treasuryPriceService.atualizarPrecos(treasuries);
        if (updatedTreasury > 0) {
            log.info("Tesouro Direto: {}/{} posições atualizadas", updatedTreasury, treasuries.size());
        }

        return updated + updatedTreasury;
    }
}
