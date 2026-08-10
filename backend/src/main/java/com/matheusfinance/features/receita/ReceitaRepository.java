package com.matheusfinance.features.receita;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReceitaRepository extends JpaRepository<Receita, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<Receita> findAllByPerfilId(Long perfilId);
    Optional<Receita> findByPerfilIdAndAnoAndMes(Long perfilId, int ano, int mes);
}
