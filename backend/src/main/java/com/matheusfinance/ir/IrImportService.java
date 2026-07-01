package com.matheusfinance.ir;

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
 * Importa operações de negociação a partir de CSV ou XLSX exportado pelo portal
 * investidor.b3.com.br → Extratos → Negociação → Exportar.
 *
 * Colunas: Data;Tipo de Movimentação;Mercado;Prazo;Instituição;Código;Quantidade;Preço;Valor
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IrImportService {

    private static final DateTimeFormatter BR_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final OperacaoRepository repository;

    public record ImportResult(int imported, int skipped, int duplicados) {}

    @Transactional
    public ImportResult importCsv(Long perfilId, byte[] fileBytes) throws Exception {
        List<String[]> rows = SpreadsheetReader.read(fileBytes);

        int imported = 0, skipped = 0, duplicados = 0;
        boolean headerFound = false;
        int colData = 0, colTipo = 1, colMercado = 2, colTicker = 5, colQtd = 6, colPreco = 7;

        for (String[] cols : rows) {
            if (cols.length == 0) continue;

            if (!headerFound) {
                String h0 = cols[0].trim().toLowerCase();
                if (h0.contains("data")) {
                    headerFound = true;
                    // Detecta índices das colunas pelo cabeçalho
                    for (int i = 0; i < cols.length; i++) {
                        String h = cols[i].trim().toLowerCase();
                        if (h.contains("movimenta"))  colTipo    = i;
                        if (h.equals("mercado"))       colMercado = i;
                        if (h.contains("código") || h.contains("codigo") || h.contains("c digo")) colTicker = i;
                        if (h.equals("quantidade"))    colQtd     = i;
                        if (h.equals("preço") || h.equals("pre o") || h.equals("preco")) colPreco = i;
                    }
                }
                continue;
            }

            int maxCol = Math.max(colTicker, colPreco);
            if (cols.length <= maxCol) { skipped++; continue; }

            try {
                LocalDate data   = parseDate(cols[colData]);
                String tipoStr   = cols[colTipo].trim().toLowerCase();
                String mercado   = cols[colMercado].trim().toLowerCase();
                String ticker    = stripFracionario(cols[colTicker].trim());
                BigDecimal qtd   = parseDecimal(cols[colQtd]);
                BigDecimal preco = parseDecimal(cols[colPreco]);

                if (data == null || ticker.isBlank() || qtd == null || preco == null) { skipped++; continue; }
                if (qtd.compareTo(BigDecimal.ZERO) <= 0 || preco.compareTo(BigDecimal.ZERO) <= 0) { skipped++; continue; }

                TipoOperacao tipo;
                if (tipoStr.contains("compra"))      tipo = TipoOperacao.COMPRA;
                else if (tipoStr.contains("venda"))  tipo = TipoOperacao.VENDA;
                else { skipped++; continue; }

                AssetType assetType = inferAssetType(ticker, mercado);

                boolean existe = repository.existsByPerfilIdAndDataAndTickerAndTipoAndQuantidadeAndPreco(
                    perfilId, data, ticker, tipo, qtd, preco);
                if (existe) { duplicados++; continue; }

                Operacao op = new Operacao();
                op.setPerfilId(perfilId);
                op.setTicker(ticker);
                op.setTipo(tipo);
                op.setQuantidade(qtd);
                op.setPreco(preco);
                op.setData(data);
                op.setDayTrade(false);
                op.setAssetType(assetType);
                repository.save(op);
                imported++;

            } catch (Exception e) {
                log.warn("Linha ignorada no import B3 negociações: {} — {}", cols[colTicker < cols.length ? colTicker : 0], e.getMessage());
                skipped++;
            }
        }

        log.info("Import B3 negociações perfilId={}: imported={} skipped={} duplicados={}", perfilId, imported, skipped, duplicados);
        return new ImportResult(imported, skipped, duplicados);
    }

    private String stripFracionario(String ticker) {
        String t = ticker.toUpperCase();
        if (t.length() >= 5 && t.endsWith("F") && !t.endsWith("11")) return t.substring(0, t.length() - 1);
        return t;
    }

    private static final java.util.Set<String> KNOWN_ETFS = java.util.Set.of(
        "BOVA11","IVVB11","SMAL11","HASH11","GOLD11","SPXI11","NASI11","DIVO11",
        "FIND11","MATB11","TECK11","UTIP11","FIXA11","ECOO11","GOVE11","IFIX11",
        "XFIX11","BBSD11","BBVO11","ELAS11","ESGB11","GOVB11","IMAB11","IRFM11",
        "LFT11","LPRE11","PREF11","USDB11","XINA11","B5P211","BRAX11","CSMO11",
        "ISUS11","EVEN11","FLMA11","SMAC11","MILA11"
    );

    private AssetType inferAssetType(String ticker, String mercado) {
        if (mercado.contains("tesouro") || ticker.startsWith("TESOURO")) return AssetType.TREASURY;
        // BDRs terminam em 32–35
        if (ticker.matches(".*3[2-5]$")) return AssetType.BDR;
        // ETFs conhecidos que terminam em 11
        if (ticker.endsWith("11") && KNOWN_ETFS.contains(ticker)) return AssetType.ETF;
        // FIIs terminam em 11
        if (ticker.endsWith("11")) return AssetType.FII;
        return AssetType.STOCK;
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
