package com.matheusfinance.meta;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "metas")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Meta {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private BigDecimal valorAlvo;

    @Column(nullable = false)
    private BigDecimal valorAtual;

    private LocalDate prazo;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
        if (valorAtual == null) valorAtual = BigDecimal.ZERO;
    }
}
