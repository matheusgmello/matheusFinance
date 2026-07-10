package com.matheusfinance.features.categoria;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<Categoria> findAllByPerfilIdOrderByNome(Long perfilId);
    Optional<Categoria> findByIdAndPerfilId(Long id, Long perfilId);
    boolean existsByPerfilIdAndNomeIgnoreCase(Long perfilId, String nome);
}
