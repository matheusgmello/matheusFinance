package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Compartilhado entre os parsers de fatura em PDF (Itaú, Nubank). Extração de
 * texto e resolução de ano são idênticas nos dois — só a gramática de linha
 * (o que vem depois da data) muda de banco pra banco.
 */
final class FaturaPdfUtil {

    private FaturaPdfUtil() {}

    static String extrairTexto(InputStream input, String nomeBanco) {
        try (PDDocument doc = Loader.loadPDF(input.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(false);
            return stripper.getText(doc);
        } catch (IOException e) {
            throw new InvalidFileFormatException("Falha ao ler PDF do " + nomeBanco + ": " + e.getMessage());
        }
    }

    /**
     * O PDF só dá dia/mês, sem ano. Se o mês da transação é posterior ao mês
     * de referência da fatura, é do ano anterior — nada é lançado no futuro
     * numa fatura já fechada (típico: parcela final de compra longa).
     */
    static LocalDate resolverData(int dia, int mes, YearMonth mesReferencia) {
        int ano = mes > mesReferencia.getMonthValue()
                ? mesReferencia.getYear() - 1
                : mesReferencia.getYear();
        return LocalDate.of(ano, mes, Math.min(dia, YearMonth.of(ano, mes).lengthOfMonth()));
    }
}
