package com.matheusfinance.features.recorrente;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecklistRepository extends JpaRepository<ChecklistRecorrente, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<ChecklistRecorrente> findByPerfilIdAndAnoAndMes(Long perfilId, int ano, int mes);
    Optional<ChecklistRecorrente> findByRecorrenteIdAndAnoAndMes(Long recorrenteId, int ano, int mes);
    List<ChecklistRecorrente> findAllByPerfilId(Long perfilId);
}
