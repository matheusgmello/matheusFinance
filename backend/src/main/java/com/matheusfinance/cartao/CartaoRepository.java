package com.matheusfinance.cartao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartaoRepository extends JpaRepository<Cartao, Long> {
    void deleteAllByPerfilId(Long perfilId);
    List<Cartao> findAllByPerfilId(Long perfilId);
    Optional<Cartao> findByIdAndPerfilId(Long id, Long perfilId);
}
