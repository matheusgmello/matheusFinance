package com.matheusfinance.alertapreco;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "alertas_preco")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AlertaPreco {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false)
    private String ticker;

    @Column(nullable = false)
    private BigDecimal precoAlvo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Direcao direcao;

    @Column(nullable = false)
    private boolean ativo;

    private OffsetDateTime disparadoEm;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = OffsetDateTime.now();
        ativo = true;
    }

    public enum Direcao { ACIMA, ABAIXO }
}
