package com.matheusfinance.orcamento;

import com.matheusfinance.compra.Parcela;
import com.matheusfinance.compra.ParcelaRepository;
import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.recorrente.PagamentoRecorrente;
import com.matheusfinance.recorrente.RecorrenteRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final PerfilRepository perfilRepository;
    private final ParcelaRepository parcelaRepository;
    private final RecorrenteRepository recorrenteRepository;

    @Transactional(readOnly = true)
    public List<OrcamentoDTO.Response> listar(Long perfilId, int ano, int mes) {
        List<Orcamento> orcamentos = orcamentoRepository.findAllByPerfilId(perfilId);

        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.with(TemporalAdjusters.lastDayOfMonth());

        Map<String, BigDecimal> gastosPorCategoria = calcularGastos(perfilId, inicio, fim);

        return orcamentos.stream()
            .map(o -> toResponse(o, gastosPorCategoria.getOrDefault(o.getCategoria(), BigDecimal.ZERO)))
            .toList();
    }

    @Transactional
    public OrcamentoDTO.Response criar(Long perfilId, OrcamentoDTO.Request req) {
        if (orcamentoRepository.existsByPerfilIdAndCategoriaIgnoreCase(perfilId, req.categoria())) {
            throw new IllegalArgumentException("Já existe um orçamento para a categoria \"" + req.categoria() + "\"");
        }
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
        Orcamento o = Orcamento.builder()
            .perfil(perfil)
            .categoria(req.categoria())
            .valorLimite(req.valorLimite())
            .build();
        orcamentoRepository.save(o);
        return toResponse(o, BigDecimal.ZERO);
    }

    @Transactional
    public OrcamentoDTO.Response atualizar(Long perfilId, Long id, OrcamentoDTO.Request req) {
        Orcamento o = orcamentoRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Orçamento não encontrado"));

        boolean categoriaChanged = !o.getCategoria().equalsIgnoreCase(req.categoria());
        if (categoriaChanged && orcamentoRepository.existsByPerfilIdAndCategoriaIgnoreCase(perfilId, req.categoria())) {
            throw new IllegalArgumentException("Já existe um orçamento para a categoria \"" + req.categoria() + "\"");
        }

        o.setCategoria(req.categoria());
        o.setValorLimite(req.valorLimite());
        return toResponse(o, BigDecimal.ZERO);
    }

    @Transactional
    public void deletar(Long perfilId, Long id) {
        Orcamento o = orcamentoRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Orçamento não encontrado"));
        orcamentoRepository.delete(o);
    }

    private Map<String, BigDecimal> calcularGastos(Long perfilId, LocalDate inicio, LocalDate fim) {
        List<Parcela> parcelas = parcelaRepository.findAllByPerfilIdAndDataVencimentoBetween(perfilId, inicio, fim);
        List<PagamentoRecorrente> recorrentes = recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId);

        Map<String, BigDecimal> gastos = parcelas.stream()
            .collect(Collectors.groupingBy(
                p -> Optional.ofNullable(p.getCompra().getCategoria()).orElse("Outros"),
                Collectors.reducing(BigDecimal.ZERO, Parcela::getValor, BigDecimal::add)));

        recorrentes.forEach(r -> {
            String cat = Optional.ofNullable(r.getCategoria()).orElse("Outros");
            gastos.merge(cat, r.getValor(), BigDecimal::add);
        });

        return gastos;
    }

    private OrcamentoDTO.Response toResponse(Orcamento o, BigDecimal gastoAtual) {
        BigDecimal percentual = o.getValorLimite().compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : gastoAtual.divide(o.getValorLimite(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        return new OrcamentoDTO.Response(o.getId(), o.getCategoria(), o.getValorLimite(), gastoAtual, percentual);
    }
}
