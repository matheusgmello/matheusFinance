package com.matheusfinance.features.recorrente;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecorrenteRepository extends JpaRepository<PagamentoRecorrente, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<PagamentoRecorrente> findAllByPerfilIdAndAtivoTrue(Long perfilId);
    List<PagamentoRecorrente> findAllByPerfilId(Long perfilId);
    Optional<PagamentoRecorrente> findByIdAndPerfilId(Long id, Long perfilId);
}
