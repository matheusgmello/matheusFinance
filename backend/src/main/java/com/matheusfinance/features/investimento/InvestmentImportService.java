package com.matheusfinance.features.investimento;

import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvestmentImportService {

    private final InvestmentPositionRepository repository;
    private final PerfilRepository perfilRepository;
    private final List<B3FileParser> parsers;
    private final B3XlsxParser xlsxParser;
    private final PnlCalculator pnlCalculator;

    @Transactional
    public InvestmentDTO.ImportResult importFile(Long perfilId, LocalDate referenceDate, byte[] fileBytes) throws IOException {
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));

        List<InvestmentDTO.ParsedPosition> positions;

        if (isXlsx(fileBytes)) {
            positions = xlsxParser.parse(fileBytes);
        } else {
            Set<String> headers = readHeaders(fileBytes);
            B3FileParser parser = parsers.stream()
                    .filter(p -> p.supportsHeaders(headers))
                    .findFirst()
                    .orElseThrow(() -> new InvalidFileFormatException(
                            "Formato de arquivo não reconhecido. Exporte o arquivo de Ações/FIIs ou Tesouro Direto da B3."));
            positions = parser.parse(new ByteArrayInputStream(fileBytes));
        }

        int imported = 0;
        int skipped = 0;
        for (InvestmentDTO.ParsedPosition pos : positions) {
            if (repository.existsByPerfilIdAndTickerAndReferenceDate(perfilId, pos.ticker(), referenceDate)) {
                skipped++;
            } else {
                repository.save(toEntity(perfil, pos, referenceDate));
                imported++;
            }
        }
        return new InvestmentDTO.ImportResult(imported, skipped);
    }

    @Transactional(readOnly = true)
    public InvestmentDTO.SummaryResponse getSummary(Long perfilId) {
        List<InvestmentPosition> positions = repository.findAllByPerfilIdOrderByTypeAscTickerAsc(perfilId);

        BigDecimal totalStocks = sum(positions, InvestmentType.STOCK);
        BigDecimal totalFiis = sum(positions, InvestmentType.FII);
        BigDecimal totalTreasury = sum(positions, InvestmentType.TREASURY);
        BigDecimal grandTotal = totalStocks.add(totalFiis).add(totalTreasury);

        List<InvestmentDTO.PositionResponse> responses = positions.stream()
                .map(this::toResponse)
                .toList();

        return new InvestmentDTO.SummaryResponse(totalStocks, totalFiis, totalTreasury, grandTotal, responses);
    }

    private static boolean isXlsx(byte[] bytes) {
        return bytes.length >= 4
                && bytes[0] == 0x50 && bytes[1] == 0x4B
                && bytes[2] == 0x03 && bytes[3] == 0x04;
    }

    private Set<String> readHeaders(byte[] fileBytes) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .build();

        try (CSVParser csv = CSVParser.parse(
                new InputStreamReader(new ByteArrayInputStream(fileBytes), StandardCharsets.UTF_8), format)) {
            return csv.getHeaderMap().keySet();
        }
    }

    private BigDecimal sum(List<InvestmentPosition> positions, InvestmentType type) {
        return positions.stream()
                .filter(p -> p.getType() == type)
                .map(InvestmentPosition::getTotalValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private InvestmentPosition toEntity(Perfil perfil, InvestmentDTO.ParsedPosition pos, LocalDate referenceDate) {
        return InvestmentPosition.builder()
                .perfil(perfil)
                .ticker(pos.ticker())
                .productName(pos.productName())
                .type(pos.type())
                .quantity(pos.quantity())
                .currentPrice(pos.currentPrice())
                .totalValue(pos.totalValue())
                .institution(pos.institution())
                .maturityDate(pos.maturityDate())
                .indexer(pos.indexer())
                .taxaAnual(pos.taxaAnual())
                .referenceDate(referenceDate)
                .build();
    }

    private InvestmentDTO.PositionResponse toResponse(InvestmentPosition p) {
        var pnl = pnlCalculator.calculate(p.getQuantity(), p.getAveragePrice(), p.getCurrentPrice());

        // averagePrice is not in the B3 export — fall back to totalValue as cost basis
        if (pnl.isEmpty() && p.getCurrentPrice() != null
                && p.getTotalValue() != null
                && p.getQuantity() != null
                && p.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentValue = p.getQuantity()
                    .multiply(p.getCurrentPrice()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal investedValue = p.getTotalValue();
            BigDecimal nominal = currentValue.subtract(investedValue);
            BigDecimal percent = investedValue.compareTo(BigDecimal.ZERO) != 0
                    ? nominal.divide(investedValue, 6, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            pnl = Optional.of(new PnlCalculator.PnlResult(investedValue, currentValue, nominal, percent));
        }

        return new InvestmentDTO.PositionResponse(
                p.getId(), p.getTicker(), p.getProductName(), p.getType(),
                p.getQuantity(), p.getAveragePrice(), p.getCurrentPrice(),
                p.getTotalValue(), p.getInstitution(), p.getMaturityDate(),
                p.getIndexer(), p.getReferenceDate(),
                p.getTaxaAnual(),
                pnl.map(PnlCalculator.PnlResult::investedValue).orElse(null),
                pnl.map(PnlCalculator.PnlResult::currentValue).orElse(null),
                pnl.map(PnlCalculator.PnlResult::nominalPnl).orElse(null),
                pnl.map(PnlCalculator.PnlResult::percentPnl).orElse(null),
                p.getLastPriceUpdate()
        );
    }
}
