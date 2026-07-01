package com.matheusfinance.rebalanceamento;

import com.matheusfinance.investimento.InvestmentPosition;
import com.matheusfinance.investimento.InvestmentPositionRepository;
import com.matheusfinance.investimento.InvestmentType;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RebalanceamentoService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final int SCALE = 2;

    private final RebalanceamentoRepository repository;
    private final InvestmentPositionRepository positionRepository;

    @Transactional
    public RebalanceamentoDTO.AlvoResponse salvarAlvo(Long perfilId, RebalanceamentoDTO.AlvoRequest req) {
        String label = req.label().toUpperCase().trim();
        RebalanceamentoAlvo alvo = repository.findByPerfilIdAndLabel(perfilId, label)
                .orElse(new RebalanceamentoAlvo());
        alvo.setPerfilId(perfilId);
        alvo.setLabel(label);
        alvo.setTipo(req.tipo());
        alvo.setPercentualAlvo(req.percentualAlvo());
        return toResponse(repository.save(alvo));
    }

    @Transactional(readOnly = true)
    public List<RebalanceamentoDTO.AlvoResponse> listarAlvos(Long perfilId) {
        return repository.findAllByPerfilIdOrderByTipoAscLabelAsc(perfilId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void deletarAlvo(Long id, Long perfilId) {
        RebalanceamentoAlvo alvo = repository.findByIdAndPerfilId(id, perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Alvo não encontrado"));
        repository.delete(alvo);
    }

    @Transactional(readOnly = true)
    public RebalanceamentoDTO.Calculo calcular(Long perfilId, BigDecimal aporteDesejado) {
        List<RebalanceamentoAlvo> alvos = repository.findAllByPerfilIdOrderByTipoAscLabelAsc(perfilId);
        List<InvestmentPosition> positions = positionRepository.findAllByPerfilIdOrderByTypeAscTickerAsc(perfilId);

        BigDecimal totalCarteira = positions.stream()
                .map(InvestmentPosition::getTotalValue)
                .reduce(ZERO, BigDecimal::add);

        // Valor atual por classe
        Map<String, BigDecimal> valorPorClasse = positions.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getType().name(),
                        Collectors.reducing(ZERO, InvestmentPosition::getTotalValue, BigDecimal::add)));

        // Valor atual por ticker
        Map<String, BigDecimal> valorPorTicker = positions.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getTicker().toUpperCase(),
                        Collectors.reducing(ZERO, InvestmentPosition::getTotalValue, BigDecimal::add)));

        BigDecimal novoTotal = aporteDesejado != null
                ? totalCarteira.add(aporteDesejado)
                : totalCarteira;

        BigDecimal totalAlvos = alvos.stream()
                .map(RebalanceamentoAlvo::getPercentualAlvo)
                .reduce(ZERO, BigDecimal::add);

        List<RebalanceamentoDTO.ItemCalculo> itens = alvos.stream().map(alvo -> {
            BigDecimal valorAtual = alvo.getTipo() == TipoAlvo.CLASSE
                    ? valorPorClasse.getOrDefault(alvo.getLabel(), ZERO)
                    : valorPorTicker.getOrDefault(alvo.getLabel(), ZERO);

            BigDecimal percentualAtual = totalCarteira.compareTo(ZERO) > 0
                    ? valorAtual.divide(totalCarteira, 6, RoundingMode.HALF_UP)
                               .multiply(BigDecimal.valueOf(100))
                               .setScale(SCALE, RoundingMode.HALF_UP)
                    : ZERO;

            BigDecimal valorAlvoNovo = alvo.getPercentualAlvo()
                    .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)
                    .multiply(novoTotal)
                    .setScale(SCALE, RoundingMode.HALF_UP);

            BigDecimal diferencaValor = valorAlvoNovo.subtract(valorAtual).setScale(SCALE, RoundingMode.HALF_UP);
            BigDecimal diferencaPercent = alvo.getPercentualAlvo().subtract(percentualAtual).setScale(SCALE, RoundingMode.HALF_UP);

            // Sugestão de aporte: quanto aportar neste item para atingir o alvo
            // Só sugere valores positivos (não sugere vender)
            BigDecimal sugestao = diferencaValor.max(ZERO);

            return new RebalanceamentoDTO.ItemCalculo(
                    alvo.getLabel(), alvo.getTipo(),
                    alvo.getPercentualAlvo(), valorAtual, percentualAtual,
                    diferencaValor, diferencaPercent, sugestao);
        }).toList();

        // Distribui o aporte proporcionalmente à deficiência de cada item
        BigDecimal aporteTotal = distribuirAporte(itens, aporteDesejado);

        return new RebalanceamentoDTO.Calculo(
                totalCarteira.setScale(SCALE, RoundingMode.HALF_UP),
                totalAlvos.setScale(SCALE, RoundingMode.HALF_UP),
                itens, aporteDesejado,
                aporteTotal.setScale(SCALE, RoundingMode.HALF_UP));
    }

    /**
     * Redistribui o aporte disponível proporcionalmente à deficiência (diferencaValor positivo).
     * Se o aporte cobre tudo, mantém as sugestões originais.
     * Se não cobre, escala proporcionalmente.
     */
    private BigDecimal distribuirAporte(List<RebalanceamentoDTO.ItemCalculo> itens, BigDecimal aporte) {
        if (aporte == null || aporte.compareTo(ZERO) <= 0) return ZERO;

        BigDecimal totalNecessario = itens.stream()
                .map(RebalanceamentoDTO.ItemCalculo::sugestaoAporte)
                .reduce(ZERO, BigDecimal::add);

        if (totalNecessario.compareTo(ZERO) == 0) return ZERO;
        if (aporte.compareTo(totalNecessario) >= 0) return totalNecessario;
        return aporte;
    }

    private RebalanceamentoDTO.AlvoResponse toResponse(RebalanceamentoAlvo a) {
        return new RebalanceamentoDTO.AlvoResponse(a.getId(), a.getLabel(), a.getTipo(), a.getPercentualAlvo());
    }
}
