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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class B3StockFiiParser implements B3FileParser {

    private static final String COL_PRODUTO = "Produto";
    private static final String COL_TICKER = "Código de Negociação";
    private static final String COL_INSTITUICAO = "Instituição";
    private static final String COL_QUANTIDADE = "Quantidade";
    private static final String COL_PRECO = "Preço de Fechamento";
    private static final String COL_VALOR = "Valor Atualizado";

    @Override
    public boolean supportsHeaders(Set<String> headers) {
        return headers.contains(COL_TICKER) && headers.contains(COL_PRECO);
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
                        "Cabeçalho inválido: coluna '" + COL_TICKER + "' não encontrada. " +
                        "Use o arquivo de Ações e Fundos de Investimento exportado da B3.");
            }

            List<InvestmentDTO.ParsedPosition> result = new ArrayList<>();
            for (var record : csv) {
                String ticker = record.get(COL_TICKER).trim();
                if (ticker.isBlank()) continue;

                result.add(new InvestmentDTO.ParsedPosition(
                        ticker,
                        record.get(COL_PRODUTO),
                        detectType(ticker),
                        parseBrazilian(record.get(COL_QUANTIDADE)),
                        parseBrazilian(record.get(COL_PRECO)),
                        parseBrazilian(record.get(COL_VALOR)),
                        record.get(COL_INSTITUICAO),
                        null,
                        null,
                        null
                ));
            }
            return result;
        }
    }

    private InvestmentType detectType(String ticker) {
        String t = ticker.toUpperCase();
        // BDRs terminam em 32, 33, 34 ou 35 (ex: MSFT34, AAPL34)
        if (t.matches(".*3[2-5]$")) return InvestmentType.BDR;
        // ETFs nacionais conhecidos que terminam em 11 (não são FIIs)
        if (t.endsWith("11") && isKnownEtf(t)) return InvestmentType.ETF;
        // FIIs terminam em 11
        if (t.endsWith("11")) return InvestmentType.FII;
        return InvestmentType.STOCK;
    }

    private static final java.util.Set<String> KNOWN_ETFS = java.util.Set.of(
        "BOVA11","IVVB11","SMAL11","HASH11","GOLD11","SPXI11","NASI11","DIVO11",
        "FIND11","MATB11","TECK11","UTIP11","FIXA11","ECOO11","GOVE11","IFIX11",
        "XFIX11","BBSD11","BBVO11","ELAS11","ESGB11","GOVB11","IMAB11","IRFM11",
        "LFT11","LPRE11","PREF11","USDB11","XINA11","B5P211","BRAX11","CSMO11",
        "ISUS11","EVEN11","FLMA11","SMAC11","MILA11"
    );

    private boolean isKnownEtf(String ticker) {
        return KNOWN_ETFS.contains(ticker);
    }

    static BigDecimal parseBrazilian(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        return new BigDecimal(value.trim().replace(".", "").replace(",", "."));
    }
}
