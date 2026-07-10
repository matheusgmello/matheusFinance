package com.matheusfinance.features.ir;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OperacaoRepository extends JpaRepository<Operacao, Long> {

    List<Operacao> findAllByPerfilIdOrderByDataAscIdAsc(Long perfilId);

    List<Operacao> findAllByPerfilIdAndAssetTypeOrderByDataAscIdAsc(Long perfilId, AssetType assetType);

    Optional<Operacao> findByIdAndPerfilId(Long id, Long perfilId);

    boolean existsByPerfilIdAndDataAndTickerAndTipoAndQuantidadeAndPreco(
        Long perfilId, LocalDate data, String ticker, TipoOperacao tipo, BigDecimal quantidade, BigDecimal preco);

    @org.springframework.data.jpa.repository.Query("""
        SELECT COALESCE(SUM(o.quantidade * o.preco), 0)
        FROM Operacao o
        WHERE o.perfilId = :perfilId
          AND o.tipo = com.matheusfinance.features.ir.TipoOperacao.VENDA
          AND o.assetType = com.matheusfinance.features.ir.AssetType.STOCK
          AND o.dayTrade = false
          AND FUNCTION('TO_CHAR', o.data, 'YYYY-MM') = :mes
    """)
    BigDecimal totalVendasSwingStockNoMes(Long perfilId, String mes);
}
