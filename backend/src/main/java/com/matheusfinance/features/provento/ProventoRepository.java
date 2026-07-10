package com.matheusfinance.features.provento;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProventoRepository extends JpaRepository<Provento, Long> {

    List<Provento> findAllByPerfilIdOrderByDataPagamentoDesc(Long perfilId);

    List<Provento> findAllByPerfilIdAndTickerOrderByDataPagamentoDesc(Long perfilId, String ticker);

    @Query("""
        SELECT p.ticker, SUM(p.valor)
        FROM Provento p
        WHERE p.perfilId = :perfilId
        GROUP BY p.ticker
        ORDER BY SUM(p.valor) DESC
    """)
    List<Object[]> totalPorTicker(Long perfilId);

    @Query("""
        SELECT FUNCTION('TO_CHAR', p.dataPagamento, 'YYYY-MM') AS mes,
               SUM(p.valor)
        FROM Provento p
        WHERE p.perfilId = :perfilId
        GROUP BY FUNCTION('TO_CHAR', p.dataPagamento, 'YYYY-MM')
        ORDER BY FUNCTION('TO_CHAR', p.dataPagamento, 'YYYY-MM') DESC
    """)
    List<Object[]> totalPorMes(Long perfilId);

    @Query("""
        SELECT p.ticker, SUM(p.valor)
        FROM Provento p
        WHERE p.perfilId = :perfilId
          AND p.dataPagamento >= :desde
        GROUP BY p.ticker
        ORDER BY SUM(p.valor) DESC
    """)
    List<Object[]> totalPorTickerDesde(Long perfilId, java.time.LocalDate desde);

    boolean existsByIdAndPerfilId(Long id, Long perfilId);

    boolean existsByPerfilIdAndTickerAndDataPagamento(Long perfilId, String ticker, java.time.LocalDate dataPagamento);

    List<Provento> findAllByPerfilIdAndDataPagamentoBetweenOrderByDataPagamentoAsc(
            Long perfilId, java.time.LocalDate inicio, java.time.LocalDate fim);
}
