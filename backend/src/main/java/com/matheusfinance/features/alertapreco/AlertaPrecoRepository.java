package com.matheusfinance.features.alertapreco;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertaPrecoRepository extends JpaRepository<AlertaPreco, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<AlertaPreco> findAllByPerfilIdOrderByCriadoEmDesc(Long perfilId);
    List<AlertaPreco> findAllByTickerAndAtivoTrue(String ticker);
    List<AlertaPreco> findAllByPerfilIdAndDisparadoEmIsNotNullAndAtivoTrue(Long perfilId);
    Optional<AlertaPreco> findByIdAndPerfilId(Long id, Long perfilId);
}
