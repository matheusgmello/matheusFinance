package com.matheusfinance.investimento;

import com.matheusfinance.perfil.Perfil;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "investment_positions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(nullable = false, length = 100)
    private String ticker;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvestmentType type;

    @Column(nullable = false, precision = 18, scale = 8)
    private BigDecimal quantity;

    @Column(name = "average_price", precision = 15, scale = 2)
    private BigDecimal averagePrice;

    @Column(name = "current_price", precision = 15, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "total_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalValue;

    @Column(length = 255)
    private String institution;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(length = 50)
    private String indexer;

    /** Taxa anual contratada em %. Preenchida apenas para TREASURY via import B3. */
    @Column(name = "taxa_anual", precision = 8, scale = 4)
    private BigDecimal taxaAnual;

    @Column(name = "reference_date", nullable = false)
    private LocalDate referenceDate;

    @Column(name = "last_price_update")
    private OffsetDateTime lastPriceUpdate;

    @Column(name = "imported_at", updatable = false)
    private OffsetDateTime importedAt;

    @PrePersist
    void prePersist() {
        importedAt = OffsetDateTime.now();
    }
}
