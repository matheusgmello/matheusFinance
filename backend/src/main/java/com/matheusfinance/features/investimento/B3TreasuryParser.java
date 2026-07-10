package com.matheusfinance.features.investimento;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class B3TreasuryParser implements B3FileParser {

    private static final String COL_PRODUTO = "Produto";
    private static final String COL_VENCIMENTO = "Vencimento";
    private static final String COL_INDEXADOR = "Indexador";
    private static final String COL_QUANTIDADE = "Quantidade";
    private static final String COL_VALOR = "Valor Atualizado";
    private static final String COL_TAXA = "Taxa Compra";

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Override
    public boolean supportsHeaders(Set<String> headers) {
        return headers.contains(COL_VENCIMENTO) && headers.contains(COL_INDEXADOR);
    }

    @Override
    public List<InvestmentDTO.ParsedPosition> parse(InputStream input) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .setIgnoreEmptyLines(true)
                .build();

        try (CSVParser csv = CSVParser.parse(new InputStreamReader(input, StandardCharsets.UTF_8), format)) {
            Set<String> headers = csv.getHeaderMap().keySet();
            if (!supportsHeaders(headers)) {
                throw new InvalidFileFormatException(
                        "Cabeçalho inválido: colunas 'Vencimento' e 'Indexador' não encontradas. " +
                        "Use o arquivo do Tesouro Direto exportado da B3.");
            }

            List<InvestmentDTO.ParsedPosition> result = new ArrayList<>();
            for (var record : csv) {
                String produto = record.get(COL_PRODUTO).trim();
                if (produto.isBlank() || produto.toLowerCase().startsWith("total")) continue;

                BigDecimal taxaAnual = csv.getHeaderMap().containsKey(COL_TAXA)
                        ? parseBrazilian(record.get(COL_TAXA))
                        : null;

                result.add(new InvestmentDTO.ParsedPosition(
                        produto,
                        produto,
                        InvestmentType.TREASURY,
                        parseBrazilian(record.get(COL_QUANTIDADE)),
                        null,
                        parseBrazilian(record.get(COL_VALOR)),
                        null,
                        parseDate(record.get(COL_VENCIMENTO)),
                        record.get(COL_INDEXADOR),
                        taxaAnual
                ));
            }
            return result;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value.trim(), DATE_FMT);
    }

    private BigDecimal parseBrazilian(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(value.trim().replace(".", "").replace(",", "."));
    }
}
