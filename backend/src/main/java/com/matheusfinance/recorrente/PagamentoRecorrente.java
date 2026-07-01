package com.matheusfinance.recorrente;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "pagamentos_recorrentes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PagamentoRecorrente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false, length = 100)
    private String empresa;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    private String categoria;

    @Column(nullable = false)
    private Boolean ativo;

    @Column(name = "criado_em", updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = OffsetDateTime.now();
        if (ativo == null) ativo = true;
    }
}
