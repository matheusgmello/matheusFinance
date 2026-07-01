package com.matheusfinance.compra;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface ParcelaRepository extends JpaRepository<Parcela, Long> {
    void deleteAllByPerfilId(Long perfilId);

    List<Parcela> findAllByPerfilIdAndDataVencimentoBetween(
        Long perfilId, LocalDate inicio, LocalDate fim);

    @Query("""
        SELECT p FROM Parcela p
        JOIN FETCH p.compra c
        JOIN FETCH c.cartao
        WHERE p.perfil.id = :perfilId
          AND p.dataVencimento BETWEEN :inicio AND :fim
          AND p.paga = false
        ORDER BY p.dataVencimento
        """)
    List<Parcela> findPendentesComCompra(@Param("perfilId") Long perfilId,
                                         @Param("inicio") LocalDate inicio,
                                         @Param("fim") LocalDate fim);

    @Query("""
        SELECT p FROM Parcela p
        JOIN FETCH p.compra c
        JOIN FETCH c.cartao
        WHERE p.perfil.id = :perfilId
          AND p.dataVencimento BETWEEN :inicio AND :fim
        ORDER BY c.cartao.nome, p.dataVencimento
        """)
    List<Parcela> findFaturaByPerfilAndMes(Long perfilId, LocalDate inicio, LocalDate fim);

    @Query("""
        SELECT p FROM Parcela p
        WHERE p.perfil.id = :perfilId
          AND p.dataVencimento BETWEEN :inicio AND :fim
        ORDER BY p.dataVencimento
        """)
    List<Parcela> findProjecao(Long perfilId, LocalDate inicio, LocalDate fim);
}
