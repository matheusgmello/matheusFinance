package com.matheusfinance.features.ir;

import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IrService {

    private final OperacaoRepository repository;
    private final DarfCalculatorService calculator;

    @Transactional
    public IrDTO.OperacaoResponse criar(Long perfilId, IrDTO.OperacaoRequest req) {
        Operacao op = Operacao.builder()
                .perfilId(perfilId)
                .ticker(req.ticker().toUpperCase().trim())
                .tipo(req.tipo())
                .quantidade(req.quantidade())
                .preco(req.preco())
                .data(req.data())
                .dayTrade(req.dayTrade())
                .assetType(req.assetType())
                .build();
        return toResponse(repository.save(op));
    }

    @Transactional(readOnly = true)
    public List<IrDTO.OperacaoResponse> listar(Long perfilId) {
        return repository.findAllByPerfilIdOrderByDataAscIdAsc(perfilId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void deletar(Long id, Long perfilId) {
        Operacao op = repository.findByIdAndPerfilId(id, perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Operação não encontrada"));
        repository.delete(op);
    }

    @Transactional(readOnly = true)
    public IrDTO.Apuracao apurar(Long perfilId, Integer ano) {
        List<Operacao> ops = repository.findAllByPerfilIdOrderByDataAscIdAsc(perfilId);
        return calculator.apurar(ops, ano);
    }

    @Transactional(readOnly = true)
    public List<IrDTO.PosicaoAtual> posicoes(Long perfilId) {
        List<Operacao> ops = repository.findAllByPerfilIdOrderByDataAscIdAsc(perfilId);
        return calculator.posicoes(ops);
    }

    private static final BigDecimal LIMITE_ISENCAO = new BigDecimal("20000.00");

    @Transactional(readOnly = true)
    public IrDTO.Isentometro isentometro(Long perfilId) {
        String mes = LocalDate.now().toString().substring(0, 7); // "2026-05"
        BigDecimal total = repository.totalVendasSwingStockNoMes(perfilId, mes);
        BigDecimal percentual = total.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : total.divide(LIMITE_ISENCAO, 4, RoundingMode.HALF_UP)
                       .multiply(BigDecimal.valueOf(100))
                       .setScale(2, RoundingMode.HALF_UP);
        return new IrDTO.Isentometro(
                mes, total, LIMITE_ISENCAO, percentual,
                total.compareTo(LIMITE_ISENCAO) <= 0);
    }

    private IrDTO.OperacaoResponse toResponse(Operacao o) {
        BigDecimal total = o.getQuantidade().multiply(o.getPreco())
                .setScale(2, java.math.RoundingMode.HALF_UP);
        return new IrDTO.OperacaoResponse(
                o.getId(), o.getTicker(), o.getTipo(),
                o.getQuantidade(), o.getPreco(), total,
                o.getData(), o.isDayTrade(), o.getAssetType());
    }
}
