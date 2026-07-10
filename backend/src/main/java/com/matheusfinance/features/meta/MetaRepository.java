package com.matheusfinance.features.meta;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MetaRepository extends JpaRepository<Meta, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<Meta> findAllByPerfilIdOrderByCriadoEmAsc(Long perfilId);
    Optional<Meta> findByIdAndPerfilId(Long id, Long perfilId);
}
