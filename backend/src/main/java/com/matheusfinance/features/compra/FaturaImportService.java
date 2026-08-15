package com.matheusfinance.features.compra;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Idempotência por fatura, não por transação: a unidade de import é
 * (cartão, mês de referência). Reimportar substitui o conteúdo daquele
 * mês inteiro para aquele cartão — sem tocar em compras de outros
 * cartões/meses nem em compras criadas manualmente (faturaMesReferencia
 * é NULL nelas, então nunca entram nesse filtro).
 */
@Service
@RequiredArgsConstructor
public class FaturaImportService {

    private final CompraRepository compraRepository;
    private final CartaoRepository cartaoRepository;
    private final PerfilRepository perfilRepository;

    @Transactional
    public FaturaImportDTO.Resultado importar(Long perfilId, Long cartaoId, YearMonth mesReferencia,
                                                List<LinhaFatura> linhas) {
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));

        Cartao cartao = cartaoRepository.findByIdAndPerfilId(cartaoId, perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + cartaoId));

        LocalDate mesRef = mesReferencia.atDay(1);
        LocalDate vencimento = mesReferencia.atDay(
                Math.min(cartao.getDiaVencimento(), mesReferencia.lengthOfMonth()));

        List<CompraParcelada> existentes = compraRepository
                .findAllByPerfilIdAndCartaoIdAndFaturaMesReferencia(perfilId, cartaoId, mesRef);
        compraRepository.deleteAll(existentes);

        List<CompraParcelada> novas = linhas.stream()
                .map(linha -> criarCompra(perfil, cartao, mesRef, vencimento, linha))
                .toList();
        compraRepository.saveAll(novas);

        return new FaturaImportDTO.Resultado(
                mesReferencia.getYear(), mesReferencia.getMonthValue(), novas.size(), vencimento);
    }

    private CompraParcelada criarCompra(Perfil perfil, Cartao cartao, LocalDate mesRef,
                                         LocalDate vencimento, LinhaFatura linha) {
        CompraParcelada compra = CompraParcelada.builder()
                .perfil(perfil)
                .cartao(cartao)
                .descricao(linha.descricao())
                .valorTotal(linha.valor())
                .numParcelas(1)
                .dataCompra(linha.data())
                .faturaMesReferencia(mesRef)
                .build();

        compra.getParcelas().add(Parcela.builder()
                .compra(compra)
                .perfil(perfil)
                .numero(1)
                .valor(linha.valor())
                .dataVencimento(vencimento)
                .paga(false)
                .build());

        return compra;
    }
}
