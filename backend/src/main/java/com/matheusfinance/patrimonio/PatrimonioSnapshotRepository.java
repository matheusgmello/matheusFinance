package com.matheusfinance.patrimonio;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PatrimonioSnapshotRepository extends JpaRepository<PatrimonioSnapshot, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<PatrimonioSnapshot> findAllByPerfilIdAndDataBetweenOrderByData(
            Long perfilId, LocalDate inicio, LocalDate fim);
    Optional<PatrimonioSnapshot> findByPerfilIdAndData(Long perfilId, LocalDate data);
}
