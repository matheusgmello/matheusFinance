package com.matheusfinance.investimento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface InvestmentPositionRepository extends JpaRepository<InvestmentPosition, Long> {
    void deleteAllByPerfilId(Long perfilId);

    boolean existsByPerfilIdAndTickerAndReferenceDate(Long perfilId, String ticker, LocalDate referenceDate);

    List<InvestmentPosition> findAllByPerfilIdOrderByTypeAscTickerAsc(Long perfilId);

    List<InvestmentPosition> findAllByTypeIn(List<InvestmentType> types);

    List<InvestmentPosition> findAllByPerfilIdAndTypeIn(Long perfilId, List<InvestmentType> types);
}
