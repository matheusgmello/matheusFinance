package com.matheusfinance.ir;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "operacoes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Operacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "perfil_id", nullable = false)
    private Long perfilId;

    @Column(nullable = false, length = 20)
    private String ticker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 6)
    private TipoOperacao tipo;

    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal quantidade;

    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal preco;

    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "day_trade", nullable = false)
    private boolean dayTrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "asset_type", nullable = false, length = 10)
    private AssetType assetType;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() { createdAt = OffsetDateTime.now(); }
}
