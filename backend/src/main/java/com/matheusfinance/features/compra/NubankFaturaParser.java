package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Fatura do Nubank: CSV com colunas date,title,amount.
 * amount vem entre aspas, decimal com vírgula, negativo como "- 123,45"
 * (pagamento ou estorno). Só linhas com valor positivo são gasto novo —
 * pagamentos e estornos são descartados aqui, na fronteira do parser.
 */
@Component
public class NubankFaturaParser {

    private static final CSVFormat FORMAT = CSVFormat.DEFAULT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setTrim(true)
            .build();

    public List<LinhaFatura> parse(InputStream input) {
        List<LinhaFatura> linhas = new ArrayList<>();
        try (CSVParser parser = CSVParser.parse(input, StandardCharsets.UTF_8, FORMAT)) {
            for (CSVRecord record : parser) {
                BigDecimal valor = parseValor(record.get("amount"));
                if (valor.signum() <= 0) continue;

                linhas.add(new LinhaFatura(
                        LocalDate.parse(record.get("date")),
                        record.get("title"),
                        valor));
            }
        } catch (IOException e) {
            throw new InvalidFileFormatException("Falha ao ler CSV do Nubank: " + e.getMessage());
        }
        return linhas;
    }

    private BigDecimal parseValor(String raw) {
        try {
            String limpo = raw.replace(" ", "").replace(",", ".");
            return new BigDecimal(limpo);
        } catch (NumberFormatException e) {
            throw new InvalidFileFormatException("Valor inválido no CSV: " + raw);
        }
    }
}
