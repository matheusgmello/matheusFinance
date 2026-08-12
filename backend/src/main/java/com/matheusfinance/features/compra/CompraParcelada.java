package com.matheusfinance.features.compra;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "compras_parceladas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompraParcelada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cartao_id", nullable = false)
    private Cartao cartao;

    @Column(nullable = false)
    private String descricao;

    @Column(name = "valor_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "num_parcelas", nullable = false)
    private Integer numParcelas;

    @Column(name = "data_compra", nullable = false)
    private LocalDate dataCompra;

    private String categoria;

    @Column(name = "fatura_mes_referencia")
    private LocalDate faturaMesReferencia;

    @Column(name = "criado_em", updatable = false)
    private OffsetDateTime criadoEm;

    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Parcela> parcelas = new ArrayList<>();

    @PrePersist
    void prePersist() {
        criadoEm = OffsetDateTime.now();
    }
}
