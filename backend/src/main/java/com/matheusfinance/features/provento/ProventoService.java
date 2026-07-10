package com.matheusfinance.features.provento;

import com.matheusfinance.features.investimento.InvestmentPositionRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
public class ProventoService {

    private final ProventoRepository repository;
    private final InvestmentPositionRepository positionRepository;

    @Transactional
    public ProventoDTO.Response criar(Long perfilId, ProventoDTO.Request req) {
        Provento p = new Provento();
        p.setPerfilId(perfilId);
        p.setTicker(req.ticker().toUpperCase());
        p.setTipo(req.tipo());
        p.setValor(req.valor());
        p.setDataPagamento(req.dataPagamento());
        p.setDataCom(req.dataCom());
        return toResponse(repository.save(p));
    }

    @Transactional(readOnly = true)
    public List<ProventoDTO.Response> listar(Long perfilId, String ticker) {
        List<Provento> proventos = ticker != null
                ? repository.findAllByPerfilIdAndTickerOrderByDataPagamentoDesc(perfilId, ticker.toUpperCase())
                : repository.findAllByPerfilIdOrderByDataPagamentoDesc(perfilId);
        return proventos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public void deletar(Long id, Long perfilId) {
        if (!repository.existsByIdAndPerfilId(id, perfilId)) {
            throw new ResourceNotFoundException("Provento não encontrado");
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public ProventoDTO.ResumoGeral resumo(Long perfilId) {
        List<Object[]> porMesRaw    = repository.totalPorMes(perfilId);
        List<Object[]> porTickerRaw = repository.totalPorTicker(perfilId);

        // Custo por ticker vindo das posições importadas
        Map<String, BigDecimal> custoPorTicker = positionRepository
                .findAllByPerfilIdOrderByTypeAscTickerAsc(perfilId)
                .stream()
                .filter(pos -> pos.getTotalValue() != null)
                .collect(Collectors.toMap(
                        pos -> pos.getTicker().toUpperCase(),
                        pos -> pos.getTotalValue(),
                        BigDecimal::add
                ));

        List<ProventoDTO.ResumoPorMes> porMes = porMesRaw.stream()
                .map(r -> new ProventoDTO.ResumoPorMes(
                        (String) r[0],
                        (BigDecimal) r[1]))
                .toList();

        List<ProventoDTO.ResumoPorTicker> porTicker = porTickerRaw.stream()
                .map(r -> {
                    String ticker = (String) r[0];
                    BigDecimal total = (BigDecimal) r[1];
                    BigDecimal custo = custoPorTicker.get(ticker);
                    BigDecimal yoc = (custo != null && custo.compareTo(BigDecimal.ZERO) > 0)
                            ? total.divide(custo, 6, RoundingMode.HALF_UP)
                                   .multiply(BigDecimal.valueOf(100))
                                   .setScale(2, RoundingMode.HALF_UP)
                            : null;
                    return new ProventoDTO.ResumoPorTicker(ticker, total, yoc);
                })
                .toList();

        BigDecimal totalAllTime = porTicker.stream()
                .map(ProventoDTO.ResumoPorTicker::totalRecebido)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Média mensal dos últimos 12 meses com pelo menos 1 pagamento
        LocalDate limite = LocalDate.now().minusMonths(12);
        BigDecimal soma12 = porMes.stream()
                .filter(m -> m.mes().compareTo(limite.toString().substring(0, 7)) >= 0)
                .map(ProventoDTO.ResumoPorMes::totalRecebido)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal media12 = soma12.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        return new ProventoDTO.ResumoGeral(totalAllTime, media12, porMes, porTicker);
    }

    @Transactional(readOnly = true)
    public ProventoDTO.ProjecaoRenda projecaoRenda(Long perfilId) {
        LocalDate desde = LocalDate.now().minusMonths(12);
        List<Object[]> raw = repository.totalPorTickerDesde(perfilId, desde);

        List<ProventoDTO.ProjecaoPorTicker> porTicker = raw.stream()
                .map(r -> {
                    String ticker = (String) r[0];
                    BigDecimal soma = (BigDecimal) r[1];
                    BigDecimal media = soma.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
                    return new ProventoDTO.ProjecaoPorTicker(ticker, media, media.multiply(BigDecimal.valueOf(12)));
                })
                .sorted((a, b) -> b.mediaMensal().compareTo(a.mediaMensal()))
                .toList();

        BigDecimal totalMensal = porTicker.stream()
                .map(ProventoDTO.ProjecaoPorTicker::mediaMensal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ProventoDTO.ProjecaoRenda(
                totalMensal,
                totalMensal.multiply(BigDecimal.valueOf(12)),
                porTicker);
    }

    @Transactional(readOnly = true)
    public List<ProventoDTO.CalendarioMes> calendario(Long perfilId, int meses) {
        LocalDate hoje      = LocalDate.now();
        LocalDate inicio    = hoje.withDayOfMonth(1);
        LocalDate fim       = hoje.plusMonths(meses).withDayOfMonth(1).minusDays(1);

        List<Provento> proventos =
                repository.findAllByPerfilIdAndDataPagamentoBetweenOrderByDataPagamentoAsc(
                        perfilId, inicio, fim);

        // Agrupar por YYYY-MM
        Map<String, List<Provento>> porMes = proventos.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getDataPagamento().toString().substring(0, 7),
                        java.util.LinkedHashMap::new,
                        Collectors.toList()));

        return porMes.entrySet().stream().map(e -> {
            String mes      = e.getKey();                    // "2026-05"
            List<Provento> itens = e.getValue();

            // Label "Mai/2026"
            LocalDate ref   = LocalDate.parse(mes + "-01");
            String label    = ref.getMonth()
                                 .getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"))
                              + "/" + ref.getYear();

            BigDecimal total = itens.stream()
                    .map(Provento::getValor)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<ProventoDTO.CalendarioItem> calendarioItens = itens.stream().map(p ->
                    new ProventoDTO.CalendarioItem(
                            p.getId(),
                            p.getTicker(),
                            p.getTipo(),
                            p.getValor(),
                            p.getDataPagamento(),
                            p.getDataPagamento().isBefore(hoje)
                    )
            ).toList();

            boolean passado = calendarioItens.stream().allMatch(ProventoDTO.CalendarioItem::recebido);

            return new ProventoDTO.CalendarioMes(mes, label, total, passado, calendarioItens);
        }).toList();
    }

    private ProventoDTO.Response toResponse(Provento p) {
        return new ProventoDTO.Response(
                p.getId(), p.getTicker(), p.getTipo(),
                p.getValor(), p.getDataPagamento(), p.getDataCom());
    }
}
