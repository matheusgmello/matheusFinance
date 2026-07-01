package com.matheusfinance.compra;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FaturaService {

    private final ParcelaRepository parcelaRepository;

    @Transactional(readOnly = true)
    public FaturaDTO.Fatura getFatura(Long perfilId, int ano, int mes) {
        LocalDate inicio = LocalDate.of(ano, mes, 1);
        LocalDate fim = inicio.with(TemporalAdjusters.lastDayOfMonth());

        List<Parcela> parcelas = parcelaRepository.findFaturaByPerfilAndMes(perfilId, inicio, fim);

        // Group by cartão preserving ORDER BY cartao.nome from query
        Map<Long, List<Parcela>> porCartao = new LinkedHashMap<>();
        for (Parcela p : parcelas) {
            Long cartaoId = p.getCompra().getCartao().getId();
            porCartao.computeIfAbsent(cartaoId, k -> new ArrayList<>()).add(p);
        }

        List<FaturaDTO.FaturaCartao> cartoes = porCartao.entrySet().stream().map(entry -> {
            List<Parcela> lista = entry.getValue();
            var cartao = lista.get(0).getCompra().getCartao();

            List<FaturaDTO.FaturaItem> itens = lista.stream().map(p -> {
                CompraParcelada compra = p.getCompra();
                return new FaturaDTO.FaturaItem(
                    p.getId(),
                    compra.getDescricao(),
                    compra.getCategoria(),
                    p.getNumero(),
                    compra.getNumParcelas(),
                    p.getValor(),
                    p.getDataVencimento(),
                    p.getPaga()
                );
            }).toList();

            BigDecimal total = lista.stream().map(Parcela::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPago = lista.stream().filter(p -> p.getPaga()).map(Parcela::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

            return new FaturaDTO.FaturaCartao(
                cartao.getId(),
                cartao.getNome(),
                cartao.getDiaVencimento(),
                total,
                totalPago,
                itens
            );
        }).toList();

        BigDecimal totalGeral = cartoes.stream().map(FaturaDTO.FaturaCartao::total).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPago = cartoes.stream().map(FaturaDTO.FaturaCartao::totalPago).reduce(BigDecimal.ZERO, BigDecimal::add);

        return new FaturaDTO.Fatura(ano, mes, totalGeral, totalPago, cartoes);
    }
}
