package com.matheusfinance.features.perfil;

import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final PerfilRepository repository;

    @Transactional(readOnly = true)
    public List<PerfilDTO.Response> listarPorUsuario(Long usuarioId) {
        return repository.findAllByUsuarioId(usuarioId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PerfilDTO.Response buscarPorId(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public PerfilDTO.Response criar(PerfilDTO.Request request, Long usuarioId) {
        Perfil perfil = Perfil.builder()
                .nome(request.nome())
                .usuarioId(usuarioId)
                .build();
        return toResponse(repository.save(perfil));
    }

    @Transactional
    public PerfilDTO.Response atualizar(Long id, PerfilDTO.Request request) {
        Perfil perfil = findOrThrow(id);
        perfil.setNome(request.nome());
        return toResponse(repository.save(perfil));
    }

    @Transactional
    public void deletar(Long id) {
        findOrThrow(id);
        repository.deleteById(id);
    }

    private Perfil findOrThrow(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + id));
    }

    private PerfilDTO.Response toResponse(Perfil p) {
        return new PerfilDTO.Response(p.getId(), p.getNome(), p.getCriadoEm());
    }
}
