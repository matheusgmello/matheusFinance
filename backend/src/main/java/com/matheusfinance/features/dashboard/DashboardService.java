package com.matheusfinance.features.dashboard;

import com.matheusfinance.features.compra.Parcela;
import com.matheusfinance.features.compra.ParcelaRepository;
import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import com.matheusfinance.features.receita.ReceitaRepository;
import com.matheusfinance.features.recorrente.PagamentoRecorrente;
import com.matheusfinance.features.recorrente.RecorrenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ParcelaRepository parcelaRepository;
    private final RecorrenteRepository recorrenteRepository;
    private final ReceitaRepository receitaRepository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public DashboardDTO.ResumoMes resumoMes(Long perfilId, int ano, int mes) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.with(TemporalAdjusters.lastDayOfMonth());
        List<Parcela> parcelas = parcelaRepository.findAllByPerfilIdAndDataVencimentoBetween(perfilId, inicio, fim);
        List<PagamentoRecorrente> recorrentes = recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId);

        BigDecimal totalParcelas = parcelas.stream()
            .map(Parcela::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRecorrentes = recorrentes.stream()
            .map(PagamentoRecorrente::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> catMap = new LinkedHashMap<>();
        parcelas.forEach(p -> {
            String cat = Optional.ofNullable(p.getCompra().getCategoria()).orElse("Outros");
            catMap.merge(cat, p.getValor(), BigDecimal::add);
        });
        recorrentes.forEach(r -> {
            String cat = Optional.ofNullable(r.getCategoria()).orElse("Outros");
            catMap.merge(cat, r.getValor(), BigDecimal::add);
        });

        List<DashboardDTO.CategoriaItem> cats = catMap.entrySet().stream()
            .map(e -> new DashboardDTO.CategoriaItem(e.getKey(), e.getValue()))
            .toList();

        BigDecimal receita = receitaRepository.findByPerfilIdAndAnoAndMes(perfilId, ano, mes)
            .map(r -> r.getValor()).orElse(BigDecimal.ZERO);
        BigDecimal totalGeral = totalParcelas.add(totalRecorrentes);
        BigDecimal saldo = receita.subtract(totalGeral);

        return new DashboardDTO.ResumoMes(
            ano, mes, totalParcelas, totalRecorrentes,
            totalGeral, receita, saldo, cats);
    }

    @Transactional(readOnly = true)
    public List<DashboardDTO.ProjecaoMes> projecao12Meses(Long perfilId) {
        LocalDate inicio = LocalDate.now().withDayOfMonth(1);
        LocalDate fim = inicio.plusMonths(12).minusDays(1);

        List<Parcela> parcelas = parcelaRepository.findProjecao(perfilId, inicio, fim);
        BigDecimal totalRecorrentes = recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId)
            .stream().map(PagamentoRecorrente::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<YearMonth, BigDecimal> parcelasPorMes = parcelas.stream()
            .collect(Collectors.groupingBy(
                p -> YearMonth.from(p.getDataVencimento()),
                Collectors.reducing(BigDecimal.ZERO, Parcela::getValor, BigDecimal::add)));

        List<DashboardDTO.ProjecaoMes> result = new ArrayList<>();

        for (int i = 0; i < 12; i++) {
            YearMonth ym = YearMonth.from(inicio.plusMonths(i));
            BigDecimal totalP = parcelasPorMes.getOrDefault(ym, BigDecimal.ZERO);
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"))
                + "/" + ym.getYear();
            result.add(new DashboardDTO.ProjecaoMes(
                ym.getYear(), ym.getMonthValue(), label,
                totalP, totalRecorrentes, totalP.add(totalRecorrentes)));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public DashboardDTO.ConsolidadoMes consolidadoMes(int ano, int mes) {
        List<Perfil> perfis = perfilRepository.findAll();
        List<DashboardDTO.PerfilResumo> resumos = perfis.stream()
            .map(p -> {
                DashboardDTO.ResumoMes r = resumoMes(p.getId(), ano, mes);
                return new DashboardDTO.PerfilResumo(p.getId(), p.getNome(), r.receita(), r.totalGeral(), r.saldo());
            })
            .toList();

        BigDecimal totalReceita  = resumos.stream().map(DashboardDTO.PerfilResumo::receita).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDespesas = resumos.stream().map(DashboardDTO.PerfilResumo::totalGeral).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSaldo    = totalReceita.subtract(totalDespesas);

        return new DashboardDTO.ConsolidadoMes(ano, mes, totalReceita, totalDespesas, totalSaldo, resumos);
    }
}
