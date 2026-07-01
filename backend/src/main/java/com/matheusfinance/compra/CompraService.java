package com.matheusfinance.compra;

import com.matheusfinance.cartao.Cartao;
import com.matheusfinance.cartao.CartaoRepository;
import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final CompraRepository compraRepository;
    private final CartaoRepository cartaoRepository;
    private final PerfilRepository perfilRepository;
    private final ParcelamentoCalculator calculator;

    @Transactional(readOnly = true)
    public List<CompraDTO.Response> listar(Long perfilId) {
        return compraRepository.findAllByPerfilId(perfilId).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CompraDTO.Response buscar(Long id, Long perfilId) {
        return toResponse(findOrThrow(id, perfilId));
    }

    @Transactional
    public CompraDTO.Response criar(CompraDTO.Request req, Long perfilId) {
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));

        Cartao cartao = cartaoRepository.findByIdAndPerfilId(req.cartaoId(), perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + req.cartaoId()));

        CompraParcelada compra = CompraParcelada.builder()
            .perfil(perfil)
            .cartao(cartao)
            .descricao(req.descricao())
            .valorTotal(req.valorTotal())
            .numParcelas(req.numParcelas())
            .dataCompra(req.dataCompra())
            .categoria(req.categoria())
            .build();

        gerarParcelas(compra, perfil, cartao, req);
        return toResponse(compraRepository.save(compra));
    }

    @Transactional
    public CompraDTO.Response atualizar(Long id, CompraDTO.Request req, Long perfilId) {
        CompraParcelada compra = findOrThrow(id, perfilId);

        Cartao cartao = cartaoRepository.findByIdAndPerfilId(req.cartaoId(), perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + req.cartaoId()));

        // Atualiza campos da compra
        compra.setCartao(cartao);
        compra.setDescricao(req.descricao());
        compra.setValorTotal(req.valorTotal());
        compra.setNumParcelas(req.numParcelas());
        compra.setDataCompra(req.dataCompra());
        compra.setCategoria(req.categoria());

        // Regenera parcelas: remove todas e recria
        compra.getParcelas().clear();
        gerarParcelas(compra, compra.getPerfil(), cartao, req);

        return toResponse(compraRepository.save(compra));
    }

    @Transactional
    public void deletar(Long id, Long perfilId) {
        findOrThrow(id, perfilId);
        compraRepository.deleteById(id);
    }

    private void gerarParcelas(CompraParcelada compra, Perfil perfil, Cartao cartao, CompraDTO.Request req) {
        LocalDate primVenc = calculator.calcularPrimeiroVencimento(
            req.dataCompra(), cartao.getDiaVencimento(), cartao.getDiaFechamento());

        BigDecimal valorParcela = req.valorTotal()
            .divide(BigDecimal.valueOf(req.numParcelas()), 2, RoundingMode.DOWN);
        BigDecimal diferenca = req.valorTotal()
            .subtract(valorParcela.multiply(BigDecimal.valueOf(req.numParcelas())));

        List<Parcela> parcelas = new ArrayList<>();
        for (int i = 1; i <= req.numParcelas(); i++) {
            BigDecimal valor = valorParcela;
            if (i == req.numParcelas()) {
                valor = valor.add(diferenca);
            }
            Parcela p = Parcela.builder()
                .compra(compra)
                .perfil(perfil)
                .numero(i)
                .valor(valor)
                .dataVencimento(calculator.calcularVencimentoParcela(primVenc, i))
                .paga(false)
                .build();
            parcelas.add(p);
        }
        compra.getParcelas().addAll(parcelas);
    }

    private CompraParcelada findOrThrow(Long id, Long perfilId) {
        return compraRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Compra não encontrada: " + id));
    }

    private CompraDTO.Response toResponse(CompraParcelada c) {
        List<CompraDTO.ParcelaResponse> parcelas = c.getParcelas().stream()
            .map(p -> new CompraDTO.ParcelaResponse(
                p.getId(), p.getNumero(), p.getValor(),
                p.getDataVencimento(), p.getPaga(), p.getPagaEm()))
            .toList();
        return new CompraDTO.Response(
            c.getId(), c.getPerfil().getId(), c.getCartao().getId(),
            c.getCartao().getNome(), c.getDescricao(), c.getValorTotal(),
            c.getNumParcelas(), c.getDataCompra(), c.getCategoria(),
            c.getCriadoEm(), parcelas);
    }
}
