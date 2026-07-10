package com.matheusfinance.features.compra;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompraRepository extends JpaRepository<CompraParcelada, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<CompraParcelada> findAllByPerfilId(Long perfilId);
    Optional<CompraParcelada> findByIdAndPerfilId(Long id, Long perfilId);

    @Query("SELECT DISTINCT c FROM CompraParcelada c LEFT JOIN FETCH c.cartao LEFT JOIN FETCH c.parcelas WHERE c.perfil.id = :perfilId")
    List<CompraParcelada> findAllByPerfilIdWithParcelas(@Param("perfilId") Long perfilId);
}
