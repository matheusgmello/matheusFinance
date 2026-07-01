package com.matheusfinance.ir;

import com.matheusfinance.investimento.InvestmentPosition;
import com.matheusfinance.investimento.InvestmentPositionRepository;
import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.provento.Provento;
import com.matheusfinance.provento.ProventoRepository;
import com.matheusfinance.provento.TipoProvento;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gera um relatório PDF com as informações necessárias para declaração do IRPF.
 * Organizado pelas fichas do programa da Receita Federal:
 *   - Bens e Direitos (posições em 31/12)
 *   - Renda Variável (apuração mensal)
 *   - Rendimentos Isentos (FII dividendos)
 *   - Rendimentos Sujeitos à Tributação Exclusiva (JCP)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IrDeclaracaoService {

    private final PerfilRepository perfilRepository;
    private final OperacaoRepository operacaoRepository;
    private final InvestmentPositionRepository positionRepository;
    private final ProventoRepository proventoRepository;
    private final DarfCalculatorService calculator;

    public byte[] gerarRelatorio(Long perfilId, int ano) {
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        List<Operacao> ops = operacaoRepository.findAllByPerfilIdOrderByDataAscIdAsc(perfilId);
        IrDTO.Apuracao apuracao = calculator.apurar(ops, ano);

        // Posições do perfil (aproximação: posições atuais como proxy de 31/12)
        List<InvestmentPosition> posicoes = positionRepository.findAllByPerfilIdOrderByTypeAscTickerAsc(perfilId);

        // Proventos do ano
        LocalDate inicioAno = LocalDate.of(ano, 1, 1);
        LocalDate fimAno    = LocalDate.of(ano, 12, 31);
        List<Provento> proventos = proventoRepository
                .findAllByPerfilIdAndDataPagamentoBetweenOrderByDataPagamentoAsc(perfilId, inicioAno, fimAno);

        return buildPdf(perfil, ano, apuracao, posicoes, proventos);
    }

    private byte[] buildPdf(Perfil perfil, int ano, IrDTO.Apuracao apuracao,
                             List<InvestmentPosition> posicoes, List<Provento> proventos) {
        try (PDDocument doc = new PDDocument()) {
            PDType1Font fontBold   = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            float margin = 45f;
            float pageW  = PDRectangle.A4.getWidth();
            float pageH  = PDRectangle.A4.getHeight();
            float contentW = pageW - 2 * margin;

            // ── Página 1: capa + Bens e Direitos ──────────────────────────────
            PDPage page1 = new PDPage(PDRectangle.A4);
            doc.addPage(page1);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page1)) {
                float y = pageH - margin;

                // Cabeçalho
                y = drawHeader(cs, fontBold, pageW, margin, y, ano, perfil);
                y -= 8;

                // Seção: Bens e Direitos
                y = drawSectionTitle(cs, fontBold, "BENS E DIREITOS — Posições em carteira", margin, y);
                y = drawSmall(cs, fontNormal,
                    "Preencha na ficha Bens e Direitos do IRPF. Código: 31 (Ações), 73 (FII), 45 (Tesouro), 49 (BDR/ETF).",
                    margin, y);
                y -= 4;

                if (posicoes.isEmpty()) {
                    y = drawLine(cs, fontNormal, 9, "Nenhuma posição importada.", margin + 4, y);
                } else {
                    // Cabeçalho da tabela
                    y = drawTableHeader(cs, fontBold, margin, y, contentW,
                        new String[]{"Ticker", "Tipo", "Qtd", "Custo Médio", "Custo Total (R$)"},
                        new float[]{0, 100, 180, 240, 360});

                    for (InvestmentPosition p : posicoes) {
                        if (y < 80) { // nova página se necessário
                            page1 = new PDPage(PDRectangle.A4);
                            doc.addPage(page1);
                        }
                        BigDecimal custoTotal = p.getTotalValue() != null ? p.getTotalValue() : BigDecimal.ZERO;
                        BigDecimal custoMedio = p.getQuantity() != null && p.getQuantity().compareTo(BigDecimal.ZERO) > 0
                                ? custoTotal.divide(p.getQuantity(), 2, java.math.RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                        y = drawTableRow(cs, fontNormal, margin, y, contentW,
                            new String[]{
                                p.getTicker(),
                                p.getType() != null ? p.getType().name() : "-",
                                p.getQuantity() != null ? p.getQuantity().toPlainString() : "-",
                                brl(custoMedio),
                                brl(custoTotal)
                            },
                            new float[]{0, 100, 180, 240, 360});
                    }
                }
                y -= 16;

                // Seção: Renda Variável
                y = drawSectionTitle(cs, fontBold, "RENDA VARIÁVEL — Apuração " + ano, margin, y);
                y = drawSmall(cs, fontNormal,
                    "Preencha na ficha Renda Variável do IRPF. Código DARF: 6015 (ações/FII/BDR) ou 0977 (Tesouro).",
                    margin, y);
                y -= 4;

                for (IrDTO.ResumoPorCategoria cat : apuracao.categorias()) {
                    if (cat.meses().isEmpty()) continue;
                    y = drawSmall(cs, fontBold, catLabel(cat.categoria()), margin + 4, y);

                    for (IrDTO.ApuracaoMensal m : cat.meses()) {
                        if (y < 80) break;
                        String status = m.isento() ? "Isento" : m.impostoDevido().compareTo(BigDecimal.ZERO) > 0
                                ? "DARF " + brl(m.impostoDevido()) : m.resultadoBruto().compareTo(BigDecimal.ZERO) < 0
                                ? "Prejuízo" : "-";
                        y = drawTableRow(cs, fontNormal, margin, y, contentW,
                            new String[]{m.mes(), brl(m.totalVendido()), brl(m.resultadoBruto()), status},
                            new float[]{0, 80, 200, 320});
                    }
                    y -= 4;
                }
            }

            // ── Página 2: proventos ───────────────────────────────────────────
            PDPage page2 = new PDPage(PDRectangle.A4);
            doc.addPage(page2);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page2)) {
                float y = pageH - margin;
                y = drawHeaderSimple(cs, fontBold, pageW, margin, y, "Proventos Recebidos — " + ano);

                // Agrupa proventos por tipo
                Map<TipoProvento, List<Provento>> porTipo = proventos.stream()
                        .collect(Collectors.groupingBy(Provento::getTipo));

                // FII dividendos → Rendimentos Isentos
                List<Provento> fiiDiv = porTipo.getOrDefault(TipoProvento.DIVIDENDO, List.of())
                        .stream().filter(p -> isProventoFii(p, posicoes)).toList();
                BigDecimal totalDivFii = fiiDiv.stream().map(Provento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

                y = drawSectionTitle(cs, fontBold,
                    "RENDIMENTOS ISENTOS — FII Dividendos (ficha Rendimentos Isentos, cód. 09)", margin, y);
                y = drawSmall(cs, fontNormal,
                    "Total " + ano + ": " + brl(totalDivFii) + " — inclua por fundo na ficha.",
                    margin, y);
                y -= 4;

                if (!proventos.isEmpty()) {
                    y = drawTableHeader(cs, fontBold, margin, y, contentW,
                        new String[]{"Data", "Ticker", "Tipo", "Valor (R$)"},
                        new float[]{0, 80, 200, 320});
                    for (Provento p : proventos) {
                        if (y < 80) break;
                        y = drawTableRow(cs, fontNormal, margin, y, contentW,
                            new String[]{p.getDataPagamento().toString(), p.getTicker(),
                                         tipoLabel(p.getTipo()), brl(p.getValor())},
                            new float[]{0, 80, 200, 320});
                    }
                } else {
                    y = drawLine(cs, fontNormal, 9, "Nenhum provento registrado em " + ano + ".", margin + 4, y);
                }
                y -= 16;

                // JCP → Rendimentos Tributáveis Exclusivos
                List<Provento> jcps = porTipo.getOrDefault(TipoProvento.JCP, List.of());
                BigDecimal totalJcp = jcps.stream().map(Provento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
                y = drawSectionTitle(cs, fontBold,
                    "RENDIMENTOS TRIBUTÁVEIS — JCP (ficha Rendimentos Sujeitos à Tributação Exclusiva)", margin, y);
                y = drawSmall(cs, fontNormal,
                    "Total JCP " + ano + ": " + brl(totalJcp) + " — IR retido na fonte 15% (já descontado pela empresa).",
                    margin, y);
                y -= 16;

                // Rodapé
                cs.setNonStrokingColor(0.6f, 0.6f, 0.6f);
                cs.beginText();
                cs.setFont(fontNormal, 8);
                cs.newLineAtOffset(margin, 35);
                cs.showText("Relatório gerado pelo matheusFinance em " +
                        LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                        "  |  Use como referência — confira os valores no programa IRPF da Receita Federal.");
                cs.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Erro ao gerar declaração IRPF", e);
            throw new RuntimeException("Erro ao gerar declaração IRPF", e);
        }
    }

    // ── Drawing helpers ────────────────────────────────────────────────────────

    private float drawHeader(PDPageContentStream cs, PDType1Font fontBold,
                              float pageW, float margin, float y, int ano, Perfil perfil) throws Exception {
        cs.setNonStrokingColor(0.08f, 0.40f, 0.28f);
        cs.addRect(margin, y - 12, pageW - 2 * margin, 34);
        cs.fill();
        cs.setNonStrokingColor(1f, 1f, 1f);
        cs.beginText();
        cs.setFont(fontBold, 13);
        cs.newLineAtOffset(margin + 8, y + 4);
        cs.showText("Relatório IRPF " + ano + " — " + perfil.getNome() +
                (perfil.getCpf() != null && !perfil.getCpf().isBlank() ? "  |  CPF: " + perfil.getCpf() : ""));
        cs.endText();
        cs.setNonStrokingColor(0f, 0f, 0f);
        return y - 50;
    }

    private float drawHeaderSimple(PDPageContentStream cs, PDType1Font fontBold,
                                    float pageW, float margin, float y, String title) throws Exception {
        cs.setNonStrokingColor(0.08f, 0.40f, 0.28f);
        cs.addRect(margin, y - 12, pageW - 2 * margin, 30);
        cs.fill();
        cs.setNonStrokingColor(1f, 1f, 1f);
        cs.beginText();
        cs.setFont(fontBold, 12);
        cs.newLineAtOffset(margin + 8, y + 2);
        cs.showText(title);
        cs.endText();
        cs.setNonStrokingColor(0f, 0f, 0f);
        return y - 46;
    }

    private float drawSectionTitle(PDPageContentStream cs, PDType1Font font, String title, float x, float y) throws Exception {
        cs.setNonStrokingColor(0.15f, 0.15f, 0.15f);
        cs.beginText();
        cs.setFont(font, 10);
        cs.newLineAtOffset(x, y);
        cs.showText(title);
        cs.endText();
        cs.setStrokingColor(0.7f, 0.7f, 0.7f);
        cs.moveTo(x, y - 3);
        cs.lineTo(x + 505, y - 3);
        cs.stroke();
        cs.setNonStrokingColor(0f, 0f, 0f);
        return y - 16;
    }

    private float drawSmall(PDPageContentStream cs, PDType1Font font, String text, float x, float y) throws Exception {
        cs.beginText();
        cs.setFont(font, 8.5f);
        cs.setNonStrokingColor(0.35f, 0.35f, 0.35f);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        cs.setNonStrokingColor(0f, 0f, 0f);
        return y - 13;
    }

    private float drawLine(PDPageContentStream cs, PDType1Font font, float size, String text, float x, float y) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(0.4f, 0.4f, 0.4f);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - (size + 4);
    }

    private float drawTableHeader(PDPageContentStream cs, PDType1Font font, float marginX, float y,
                                   float contentW, String[] cols, float[] offsets) throws Exception {
        cs.setNonStrokingColor(0.93f, 0.93f, 0.93f);
        cs.addRect(marginX, y - 3, contentW, 14);
        cs.fill();
        cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
        for (int i = 0; i < cols.length; i++) {
            cs.beginText();
            cs.setFont(font, 8);
            cs.newLineAtOffset(marginX + 4 + offsets[i], y);
            cs.showText(cols[i]);
            cs.endText();
        }
        return y - 15;
    }

    private float drawTableRow(PDPageContentStream cs, PDType1Font font, float marginX, float y,
                                float contentW, String[] vals, float[] offsets) throws Exception {
        cs.setNonStrokingColor(0f, 0f, 0f);
        for (int i = 0; i < vals.length; i++) {
            cs.beginText();
            cs.setFont(font, 8.5f);
            cs.newLineAtOffset(marginX + 4 + offsets[i], y);
            cs.showText(vals[i] != null ? vals[i] : "-");
            cs.endText();
        }
        return y - 13;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String brl(BigDecimal v) {
        if (v == null) return "R$ 0,00";
        return String.format(new Locale("pt", "BR"), "R$ %,.2f", v);
    }

    private String catLabel(IrDTO.Categoria c) {
        return switch (c) {
            case SWING_TRADE_ACAO -> "Swing Trade — Ações";
            case DAY_TRADE_ACAO   -> "Day Trade — Ações";
            case FII              -> "FIIs";
            case TREASURY         -> "Tesouro Direto";
            case BDR_ETF          -> "BDR / ETF Nacional";
            case STOCK_INT        -> "Ações / ETF Internacional";
        };
    }

    private String tipoLabel(TipoProvento t) {
        return switch (t) {
            case DIVIDENDO    -> "Dividendo";
            case JCP          -> "JCP";
            case RENDIMENTO   -> "Rendimento";
            case AMORTIZACAO  -> "Amortização";
        };
    }

    private boolean isProventoFii(Provento p, List<InvestmentPosition> posicoes) {
        return posicoes.stream()
                .anyMatch(pos -> pos.getTicker().equalsIgnoreCase(p.getTicker())
                        && "FII".equals(pos.getType() != null ? pos.getType().name() : ""));
    }
}
