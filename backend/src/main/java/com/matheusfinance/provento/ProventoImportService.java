package com.matheusfinance.provento;

import com.matheusfinance.shared.util.SpreadsheetReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Importa proventos a partir de CSV ou XLSX exportado pelo portal investidor.b3.com.br.
 *
 * Suporta dois layouts:
 *  - CSV B3 antigo: Produto;Tipo de Evento;Data Com;Data Pagamento;Valor Líquido
 *  - XLSX B3 novo:  Produto;Pagamento;Tipo de Evento;Instituição;Quantidade;Preço unit;Valor líquido
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProventoImportService {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ProventoRepository repository;

    @Transactional
    public ProventoDTO.ImportResult importCsv(Long perfilId, byte[] fileBytes) throws Exception {
        List<String[]> rows = SpreadsheetReader.read(fileBytes);

        int imported = 0, skipped = 0;
        boolean headerFound = false;
        boolean xlsxLayout = false; // true = layout novo do XLSX da B3

        for (String[] cols : rows) {
            if (cols.length == 0) continue;
            String first = cols[0].trim().toLowerCase();

            if (!headerFound) {
                if (first.contains("produto")) {
                    headerFound = true;
                    // Detecta layout pelo cabeçalho da segunda coluna
                    xlsxLayout = cols.length > 1 && cols[1].trim().toLowerCase().contains("pagamento")
                                 && !cols[1].trim().toLowerCase().contains("data");
                }
                continue;
            }

            try {
                String ticker;
                TipoProvento tipo;
                LocalDate dataCom;
                LocalDate dataPagamento;
                BigDecimal valor;

                if (xlsxLayout) {
                    // Cols: [0]=Produto [1]=Pagamento [2]=Tipo [3]=Inst [4]=Qtd [5]=Preco [6]=ValorLiq
                    if (cols.length < 7) { skipped++; continue; }
                    ticker         = parseTicker(cols[0]);
                    dataPagamento  = parseDate(cols[1]);
                    tipo           = parseTipo(cols[2]);
                    dataCom        = null;
                    valor          = parseDecimal(cols[6]);
                } else {
                    // Cols: [0]=Produto [1]=Tipo [2]=DataCom [3]=DataPag [4]=Valor
                    if (cols.length < 5) { skipped++; continue; }
                    ticker         = parseTicker(cols[0]);
                    tipo           = parseTipo(cols[1]);
                    dataCom        = parseDate(cols[2]);
                    dataPagamento  = parseDate(cols[3]);
                    valor          = parseDecimal(cols[4]);
                }

                if (ticker.isBlank() || dataPagamento == null || valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
                    skipped++; continue;
                }

                if (repository.existsByPerfilIdAndTickerAndDataPagamento(perfilId, ticker, dataPagamento)) {
                    skipped++; continue;
                }

                Provento p = new Provento();
                p.setPerfilId(perfilId);
                p.setTicker(ticker);
                p.setTipo(tipo);
                p.setValor(valor);
                p.setDataPagamento(dataPagamento);
                p.setDataCom(dataCom);
                repository.save(p);
                imported++;

            } catch (Exception e) {
                log.warn("Linha ignorada no import B3 proventos: {} — {}", cols[0], e.getMessage());
                skipped++;
            }
        }

        log.info("Import B3 proventos perfilId={}: imported={} skipped={}", perfilId, imported, skipped);
        return new ProventoDTO.ImportResult(imported, skipped);
    }

    private String parseTicker(String produto) {
        int dash = produto.indexOf('-');
        return (dash > 0 ? produto.substring(0, dash) : produto).trim().toUpperCase();
    }

    private TipoProvento parseTipo(String tipo) {
        String t = tipo.toLowerCase();
        if (t.contains("jcp") || t.contains("juros")) return TipoProvento.JCP;
        if (t.contains("rendimento"))                  return TipoProvento.RENDIMENTO;
        if (t.contains("amortiza"))                    return TipoProvento.AMORTIZACAO;
        return TipoProvento.DIVIDENDO;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank() || s.equals("-")) return null;
        try { return LocalDate.parse(s.trim(), BR_DATE); } catch (Exception e) { return null; }
    }

    private BigDecimal parseDecimal(String s) {
        if (s == null || s.isBlank() || s.equals("-")) return null;
        try { return new BigDecimal(s.trim().replace(".", "").replace(",", ".")); }
        catch (Exception e) { return null; }
    }
}
