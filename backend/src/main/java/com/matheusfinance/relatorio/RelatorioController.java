package com.matheusfinance.relatorio;

import com.matheusfinance.compra.Parcela;
import com.matheusfinance.compra.ParcelaRepository;
import com.matheusfinance.recorrente.ChecklistRecorrente;
import com.matheusfinance.recorrente.ChecklistRepository;
import com.matheusfinance.recorrente.PagamentoRecorrente;
import com.matheusfinance.recorrente.RecorrenteRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class RelatorioController {

    private final ParcelaRepository parcelaRepository;
    private final RecorrenteRepository recorrenteRepository;
    private final ChecklistRepository checklistRepository;

    /**
     * Todas as parcelas vencidas no ano — útil para IR e análise anual.
     * GET /api/relatorios/compras.csv?ano=2025
     */
    @GetMapping("/compras.csv")
    public void exportarCompras(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "0") int ano,
            HttpServletResponse response) throws IOException {

        if (ano == 0) ano = LocalDate.now().getYear();
        LocalDate inicio = LocalDate.of(ano, 1, 1);
        LocalDate fim    = LocalDate.of(ano, 12, 31);

        List<Parcela> parcelas = parcelaRepository.findAllByPerfilIdAndDataVencimentoBetween(perfilId, inicio, fim);

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"compras-" + ano + ".csv\"");

        // BOM UTF-8 para Excel abrir corretamente
        response.getOutputStream().write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

        try (PrintWriter pw = response.getWriter();
             CSVPrinter csv = new CSVPrinter(pw, CSVFormat.DEFAULT.builder()
                     .setHeader("Descrição", "Cartão", "Categoria", "Valor Total (R$)",
                             "Nº Parcelas", "Parcela Nº", "Valor Parcela (R$)",
                             "Vencimento", "Paga", "Data Pagamento")
                     .build())) {

            for (Parcela p : parcelas) {
                csv.printRecord(
                    p.getCompra().getDescricao(),
                    p.getCompra().getCartao() != null ? p.getCompra().getCartao().getNome() : "",
                    Optional.ofNullable(p.getCompra().getCategoria()).orElse(""),
                    p.getCompra().getValorTotal(),
                    p.getCompra().getNumParcelas(),
                    p.getNumero(),
                    p.getValor(),
                    p.getDataVencimento(),
                    p.getPaga() ? "Sim" : "Não",
                    p.getPagaEm() != null ? p.getPagaEm().toLocalDate() : ""
                );
            }
        }
    }

    /**
     * Gastos de um mês específico: parcelas + recorrentes.
     * GET /api/relatorios/gastos.csv?ano=2025&mes=4
     */
    @GetMapping("/gastos.csv")
    public void exportarGastos(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "0") int ano,
            @RequestParam(defaultValue = "0") int mes,
            HttpServletResponse response) throws IOException {

        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim    = inicio.withDayOfMonth(inicio.lengthOfMonth());

        List<Parcela> parcelas = parcelaRepository.findAllByPerfilIdAndDataVencimentoBetween(perfilId, inicio, fim);
        List<PagamentoRecorrente> recorrentes = recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId);
        List<ChecklistRecorrente> checklist = checklistRepository.findByPerfilIdAndAnoAndMes(perfilId, ano, mes);

        String mesLabel = String.format("%04d-%02d", ano, mes);
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"gastos-" + mesLabel + ".csv\"");
        response.getOutputStream().write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});

        try (PrintWriter pw = response.getWriter();
             CSVPrinter csv = new CSVPrinter(pw, CSVFormat.DEFAULT.builder()
                     .setHeader("Tipo", "Descrição", "Categoria", "Valor (R$)", "Vencimento", "Pago")
                     .build())) {

            for (Parcela p : parcelas) {
                csv.printRecord(
                    "Parcela",
                    p.getCompra().getDescricao() + " (" + p.getNumero() + "/" + p.getCompra().getNumParcelas() + ")",
                    Optional.ofNullable(p.getCompra().getCategoria()).orElse(""),
                    p.getValor(),
                    p.getDataVencimento(),
                    p.getPaga() ? "Sim" : "Não"
                );
            }

            for (PagamentoRecorrente r : recorrentes) {
                boolean pago = checklist.stream()
                    .anyMatch(cl -> cl.getRecorrente().getId().equals(r.getId()) && cl.getPago());
                csv.printRecord(
                    "Recorrente",
                    r.getEmpresa(),
                    Optional.ofNullable(r.getCategoria()).orElse(""),
                    r.getValor(),
                    mes + "/" + ano,
                    pago ? "Sim" : "Não"
                );
            }
        }
    }
}
