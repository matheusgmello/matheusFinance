package com.matheusfinance.orcamento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<Orcamento> findAllByPerfilId(Long perfilId);
    Optional<Orcamento> findByIdAndPerfilId(Long id, Long perfilId);
    boolean existsByPerfilIdAndCategoriaIgnoreCase(Long perfilId, String categoria);
}
