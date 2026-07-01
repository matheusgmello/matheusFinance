package com.matheusfinance.orcamento;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "orcamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false, length = 100)
    private String categoria;

    @Column(name = "valor_limite", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorLimite;

    @Column(name = "criado_em", updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = OffsetDateTime.now();
    }
}
