package com.matheusfinance.cartao;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartaoService {

    private final CartaoRepository cartaoRepository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<CartaoDTO.Response> listar(Long perfilId) {
        return cartaoRepository.findAllByPerfilId(perfilId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CartaoDTO.Response buscar(Long id, Long perfilId) {
        return toResponse(findOrThrow(id, perfilId));
    }

    @Transactional
    public CartaoDTO.Response criar(CartaoDTO.Request request, Long perfilId) {
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));
        Cartao cartao = Cartao.builder()
            .perfil(perfil)
            .nome(request.nome())
            .diaVencimento(request.diaVencimento())
            .diaFechamento(request.diaFechamento())
            .build();
        return toResponse(cartaoRepository.save(cartao));
    }

    @Transactional
    public CartaoDTO.Response atualizar(Long id, CartaoDTO.Request request, Long perfilId) {
        Cartao cartao = findOrThrow(id, perfilId);
        cartao.setNome(request.nome());
        cartao.setDiaVencimento(request.diaVencimento());
        cartao.setDiaFechamento(request.diaFechamento());
        return toResponse(cartaoRepository.save(cartao));
    }

    @Transactional
    public void deletar(Long id, Long perfilId) {
        findOrThrow(id, perfilId);
        cartaoRepository.deleteById(id);
    }

    private Cartao findOrThrow(Long id, Long perfilId) {
        return cartaoRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Cartão não encontrado: " + id));
    }

    private CartaoDTO.Response toResponse(Cartao c) {
        return new CartaoDTO.Response(
            c.getId(), c.getPerfil().getId(), c.getNome(),
            c.getDiaVencimento(), c.getDiaFechamento(), c.getCriadoEm());
    }
}
