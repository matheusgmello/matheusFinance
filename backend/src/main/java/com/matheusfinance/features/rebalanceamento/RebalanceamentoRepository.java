package com.matheusfinance.features.rebalanceamento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RebalanceamentoRepository extends JpaRepository<RebalanceamentoAlvo, Long> {

    List<RebalanceamentoAlvo> findAllByPerfilIdOrderByTipoAscLabelAsc(Long perfilId);

    Optional<RebalanceamentoAlvo> findByIdAndPerfilId(Long id, Long perfilId);

    boolean existsByPerfilIdAndLabel(Long perfilId, String label);

    Optional<RebalanceamentoAlvo> findByPerfilIdAndLabel(Long perfilId, String label);
}
