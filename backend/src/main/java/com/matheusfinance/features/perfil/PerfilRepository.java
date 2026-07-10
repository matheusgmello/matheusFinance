package com.matheusfinance.features.perfil;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PerfilRepository extends JpaRepository<Perfil, Long> {
    boolean existsByNomeIgnoreCase(String nome);
    Optional<Perfil> findFirstByUsuarioId(Long usuarioId);
    List<Perfil> findAllByUsuarioId(Long usuarioId);
}
