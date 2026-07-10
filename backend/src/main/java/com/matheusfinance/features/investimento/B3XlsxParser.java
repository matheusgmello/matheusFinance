package com.matheusfinance.features.investimento;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses the B3 "posicao" XLSX export (3 sheets: Acoes, Fundo de Investimento, Tesouro Direto).
 */
@Component
public class B3XlsxParser {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public List<InvestmentDTO.ParsedPosition> parse(byte[] bytes) throws IOException {
        List<InvestmentDTO.ParsedPosition> result = new ArrayList<>();

        try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(bytes))) {
            Sheet acoes = wb.getSheet("Acoes");
            Sheet fundos = wb.getSheet("Fundo de Investimento");
            Sheet tesouro = wb.getSheet("Tesouro Direto");

            if (acoes != null) {
                parseAcoesFundos(acoes, false, result);
            }
            if (fundos != null) {
                parseAcoesFundos(fundos, true, result);
            }
            if (tesouro != null) {
                parseTesouroDireto(tesouro, result);
            }
        }

        return result;
    }

    /**
     * Parses "Acoes" or "Fundo de Investimento" sheets.
     * Layout (14 cols, 0-indexed):
     *   col0 = productName, col3 = ticker, col8 = qty, col12 = currentPrice, col13 = totalValue
     *
     * Type: if forceFii=true → FII; else ticker ending "11" → FII, otherwise STOCK.
     */
    private void parseAcoesFundos(Sheet sheet, boolean forceFii, List<InvestmentDTO.ParsedPosition> out) {
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String productName = stringCell(row, 0);
            if (productName == null || productName.isBlank()) continue; // total/empty row

            String ticker = stringCell(row, 3);
            if (ticker == null || ticker.isBlank()) continue;

            BigDecimal qty = decimalCell(row, 8);
            BigDecimal price = decimalCell(row, 12);
            BigDecimal total = decimalCell(row, 13);

            InvestmentType type = forceFii || ticker.endsWith("11")
                    ? InvestmentType.FII
                    : InvestmentType.STOCK;

            out.add(new InvestmentDTO.ParsedPosition(
                    ticker,
                    productName,
                    type,
                    qty != null ? qty : BigDecimal.ZERO,
                    price,
                    total != null ? total : BigDecimal.ZERO,
                    null,
                    null,
                    null,
                    null
            ));
        }
    }

    /**
     * Parses "Tesouro Direto" sheet.
     * Layout (13+ cols, 0-indexed):
     *   col0 = productName, col2 = ISIN (ticker), col3 = indexer,
     *   col4 = maturity (DD/MM/YYYY), col5 = qty,
     *   col6 = taxaAnual ("Taxa Compra"), col12 = totalValue (Valor Atualizado)
     */
    private void parseTesouroDireto(Sheet sheet, List<InvestmentDTO.ParsedPosition> out) {
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String productName = stringCell(row, 0);
            if (productName == null || productName.isBlank()) continue;

            String ticker = stringCell(row, 2);
            if (ticker == null || ticker.isBlank()) ticker = productName;

            String indexer = stringCell(row, 3);
            LocalDate maturity = parseDateCell(row, 4);
            BigDecimal qty = decimalCell(row, 5);
            BigDecimal taxaAnual = decimalCell(row, 6);
            BigDecimal total = decimalCell(row, 12);

            out.add(new InvestmentDTO.ParsedPosition(
                    ticker,
                    productName,
                    InvestmentType.TREASURY,
                    qty != null ? qty : BigDecimal.ZERO,
                    null,
                    total != null ? total : BigDecimal.ZERO,
                    null,
                    maturity,
                    indexer,
                    taxaAnual
            ));
        }
    }

    private String stringCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            default -> null;
        };
    }

    private BigDecimal decimalCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> BigDecimal.valueOf(cell.getNumericCellValue());
            case STRING -> {
                String s = cell.getStringCellValue().trim()
                        .replace(".", "")
                        .replace(",", ".");
                if (s.isBlank()) yield null;
                try { yield new BigDecimal(s); } catch (NumberFormatException e) { yield null; }
            }
            default -> null;
        };
    }

    private LocalDate parseDateCell(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            return switch (cell.getCellType()) {
                case STRING -> LocalDate.parse(cell.getStringCellValue().trim(), BR_DATE);
                case NUMERIC -> cell.getLocalDateTimeCellValue().toLocalDate();
                default -> null;
            };
        } catch (Exception e) {
            return null;
        }
    }
}
