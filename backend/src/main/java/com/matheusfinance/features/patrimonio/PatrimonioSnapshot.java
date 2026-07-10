package com.matheusfinance.features.patrimonio;

import com.matheusfinance.features.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "patrimonio_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatrimonioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "total_investido", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInvestido;

    @Column(name = "total_atual", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAtual;
}
