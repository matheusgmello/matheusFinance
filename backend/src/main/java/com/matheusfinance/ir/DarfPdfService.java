package com.matheusfinance.ir;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DarfPdfService {

    private static final Map<IrDTO.Categoria, String> CODIGO_RECEITA = Map.of(
        IrDTO.Categoria.SWING_TRADE_ACAO, "6015",
        IrDTO.Categoria.DAY_TRADE_ACAO,   "6015",
        IrDTO.Categoria.FII,              "6015",
        IrDTO.Categoria.TREASURY,         "0977",
        IrDTO.Categoria.BDR_ETF,          "6015",
        IrDTO.Categoria.STOCK_INT,        "6015"
    );

    private static final Map<IrDTO.Categoria, String> CAT_LABEL = Map.of(
        IrDTO.Categoria.SWING_TRADE_ACAO, "Swing Trade — Ações",
        IrDTO.Categoria.DAY_TRADE_ACAO,   "Day Trade — Ações",
        IrDTO.Categoria.FII,              "Fundos de Investimento Imobiliário",
        IrDTO.Categoria.TREASURY,         "Tesouro Direto (0977)",
        IrDTO.Categoria.BDR_ETF,          "BDR / ETF Nacional",
        IrDTO.Categoria.STOCK_INT,        "Ações / ETF Internacional"
    );

    private final PerfilRepository perfilRepository;
    private final OperacaoRepository operacaoRepository;
    private final DarfCalculatorService calculator;

    public byte[] gerarDarf(Long perfilId, String mes, IrDTO.Categoria categoria) {
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        // Busca apuração do mês/categoria
        List<Operacao> ops = operacaoRepository.findAllByPerfilIdOrderByDataAscIdAsc(perfilId);
        IrDTO.Apuracao apuracao = calculator.apurar(ops, YearMonth.parse(mes).getYear());

        IrDTO.ApuracaoMensal mesData = apuracao.categorias().stream()
                .filter(c -> c.categoria() == categoria)
                .flatMap(c -> c.meses().stream())
                .filter(m -> m.mes().equals(mes))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Apuração não encontrada para " + mes + "/" + categoria));

        if (mesData.impostoDevido().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Sem imposto devido neste mês/categoria");
        }

        return buildPdf(perfil, mes, categoria, mesData);
    }

    private byte[] buildPdf(Perfil perfil, String mes, IrDTO.Categoria categoria, IrDTO.ApuracaoMensal dados) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDType1Font fontBold    = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontNormal  = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontMono    = new PDType1Font(Standard14Fonts.FontName.COURIER_BOLD);

            float pageWidth  = PDRectangle.A4.getWidth();
            float margin     = 45f;
            float contentW   = pageWidth - 2 * margin;
            float y          = PDRectangle.A4.getHeight() - margin;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {

                // ── Cabeçalho ────────────────────────────────────────────────
                cs.setNonStrokingColor(0.08f, 0.40f, 0.28f);  // emerald
                cs.addRect(margin, y - 12, contentW, 30);
                cs.fill();

                cs.beginText();
                cs.setFont(fontBold, 15);
                cs.setNonStrokingColor(1f, 1f, 1f);
                cs.newLineAtOffset(margin + 8, y + 4);
                cs.showText("DARF — Documento de Arrecadação de Receitas Federais");
                cs.endText();
                y -= 50;

                cs.setNonStrokingColor(0f, 0f, 0f);

                // ── Informações gerais ────────────────────────────────────────
                y = drawSection(cs, fontBold, "Informações do Contribuinte", margin, y);

                String cpfStr = (perfil.getCpf() != null && !perfil.getCpf().isBlank())
                        ? perfil.getCpf() : "Não informado";
                y = drawField(cs, fontBold, fontNormal, "Contribuinte", perfil.getNome(), margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "CPF", cpfStr, margin, contentW, y);

                y -= 12;

                // ── Dados do DARF ─────────────────────────────────────────────
                y = drawSection(cs, fontBold, "Dados do DARF", margin, y);

                String codigoReceita = CODIGO_RECEITA.getOrDefault(categoria, "6015");
                String catLabel = CAT_LABEL.getOrDefault(categoria, categoria.name());
                String periodoApur = formatMes(mes);
                String vencimento  = calcVencimento(mes);

                y = drawField(cs, fontBold, fontNormal, "Código de Receita",       codigoReceita,  margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Natureza da Renda",        catLabel,       margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Período de Apuração",      periodoApur,    margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Data de Vencimento",        vencimento,     margin, contentW, y);

                y -= 12;

                // ── Cálculo ───────────────────────────────────────────────────
                y = drawSection(cs, fontBold, "Memória de Cálculo", margin, y);

                y = drawField(cs, fontBold, fontNormal, "Total Vendido",       brl(dados.totalVendido()),       margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Custo das Vendas",    brl(dados.custoVendido()),       margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Resultado Bruto",     brl(dados.resultadoBruto()),     margin, contentW, y);
                if (dados.prejuizoAnterior().compareTo(BigDecimal.ZERO) > 0) {
                    y = drawField(cs, fontBold, fontNormal, "Prejuízo Compensado", "- " + brl(dados.prejuizoAnterior()), margin, contentW, y);
                }
                y = drawField(cs, fontBold, fontNormal, "Base de Cálculo",    brl(dados.baseCalculo()),        margin, contentW, y);
                y = drawField(cs, fontBold, fontNormal, "Alíquota",           dados.aliquota() + "%",           margin, contentW, y);

                y -= 6;

                // ── Valor destacado ───────────────────────────────────────────
                cs.setNonStrokingColor(0.96f, 0.98f, 0.96f);
                cs.addRect(margin, y - 14, contentW, 34);
                cs.fill();
                cs.setNonStrokingColor(0f, 0f, 0f);

                cs.beginText();
                cs.setFont(fontBold, 11);
                cs.newLineAtOffset(margin + 10, y + 8);
                cs.showText("Valor do DARF a pagar:");
                cs.endText();

                cs.beginText();
                cs.setFont(fontMono, 18);
                cs.setNonStrokingColor(0.8f, 0.1f, 0.1f);
                cs.newLineAtOffset(margin + contentW - 160, y + 5);
                cs.showText(brl(dados.impostoDevido()));
                cs.endText();

                cs.setNonStrokingColor(0f, 0f, 0f);
                y -= 50;

                // ── Instruções ────────────────────────────────────────────────
                y = drawSection(cs, fontBold, "Instruções de Pagamento", margin, y);
                String[] instrucoes = {
                    "1. O DARF deve ser pago até o último dia útil do mês seguinte ao de apuração.",
                    "2. Acesse: sicalcweb.receita.fazenda.gov.br para emitir o DARF oficial.",
                    "3. Pagamento via internet banking, correspondentes bancários ou Pix (chave CNPJ 00.394.460/0100-36).",
                    "4. Guarde este documento e os comprovantes de operações para declaração do IRPF.",
                    "5. Este documento é uma memória de cálculo — não tem validade legal como DARF oficial."
                };
                for (String linha : instrucoes) {
                    y = drawLine(cs, fontNormal, 9, linha, margin + 4, y);
                    y -= 2;
                }

                y -= 12;

                // ── Rodapé ────────────────────────────────────────────────────
                cs.setNonStrokingColor(0.6f, 0.6f, 0.6f);
                cs.beginText();
                cs.setFont(fontNormal, 8);
                cs.newLineAtOffset(margin, margin);
                cs.showText("Gerado pelo matheusFinance em " +
                        LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                        "  |  Este documento é informativo — verifique os valores antes do pagamento.");
                cs.endText();
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();

        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Erro ao gerar PDF do DARF", ex);
            throw new RuntimeException("Erro ao gerar PDF", ex);
        }
    }

    // ── Drawing helpers ────────────────────────────────────────────────────────

    private float drawSection(PDPageContentStream cs, PDType1Font font, String title, float x, float y) throws Exception {
        y -= 4;
        cs.setNonStrokingColor(0.2f, 0.2f, 0.2f);
        cs.beginText();
        cs.setFont(font, 10);
        cs.newLineAtOffset(x, y);
        cs.showText(title.toUpperCase());
        cs.endText();

        // underline
        cs.setStrokingColor(0.7f, 0.7f, 0.7f);
        cs.moveTo(x, y - 3);
        cs.lineTo(x + 505, y - 3);
        cs.stroke();

        cs.setNonStrokingColor(0f, 0f, 0f);
        return y - 16;
    }

    private float drawField(PDPageContentStream cs, PDType1Font fontBold, PDType1Font fontNormal,
                             String label, String value, float x, float contentW, float y) throws Exception {
        cs.beginText();
        cs.setFont(fontBold, 9);
        cs.setNonStrokingColor(0.4f, 0.4f, 0.4f);
        cs.newLineAtOffset(x + 4, y);
        cs.showText(label + ":");
        cs.endText();

        cs.beginText();
        cs.setFont(fontNormal, 10);
        cs.setNonStrokingColor(0f, 0f, 0f);
        cs.newLineAtOffset(x + 4 + 160, y);
        cs.showText(value);
        cs.endText();

        return y - 16;
    }

    private float drawLine(PDPageContentStream cs, PDType1Font font, int size, String text, float x, float y) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.setNonStrokingColor(0.3f, 0.3f, 0.3f);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
        return y - (size + 4);
    }

    // ── Formatters ────────────────────────────────────────────────────────────

    private String brl(BigDecimal v) {
        return String.format(new Locale("pt", "BR"), "R$ %,.2f", v);
    }

    private String formatMes(String mes) {
        YearMonth ym = YearMonth.parse(mes);
        return String.format("%02d/%d", ym.getMonthValue(), ym.getYear());
    }

    private String calcVencimento(String mes) {
        // Vencimento: último dia útil do mês seguinte (simplificado: último dia do mês)
        YearMonth proximo = YearMonth.parse(mes).plusMonths(1);
        LocalDate ultimo = proximo.atEndOfMonth();
        // Ajusta para sexta se cair no fim de semana
        while (ultimo.getDayOfWeek().getValue() > 5) {
            ultimo = ultimo.minusDays(1);
        }
        return ultimo.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }
}
