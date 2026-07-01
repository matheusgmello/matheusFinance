package com.matheusfinance.cartao;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "cartoes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cartao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(name = "dia_vencimento", nullable = false)
    private Integer diaVencimento;

    @Column(name = "dia_fechamento", nullable = false)
    private Integer diaFechamento;

    @Column(name = "criado_em", updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    void prePersist() {
        criadoEm = OffsetDateTime.now();
    }
}
