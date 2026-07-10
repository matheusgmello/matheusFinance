package com.matheusfinance.features.rebalanceamento;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "rebalanceamento_alvo",
       uniqueConstraints = @UniqueConstraint(columnNames = {"perfil_id", "label"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RebalanceamentoAlvo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "perfil_id", nullable = false)
    private Long perfilId;

    @Column(nullable = false, length = 50)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoAlvo tipo;

    @Column(name = "percentual_alvo", nullable = false, precision = 5, scale = 2)
    private BigDecimal percentualAlvo;
}
