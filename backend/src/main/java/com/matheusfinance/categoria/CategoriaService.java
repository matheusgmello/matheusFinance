package com.matheusfinance.categoria;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<CategoriaDTO.Response> listar(Long perfilId) {
        return repository.findAllByPerfilIdOrderByNome(perfilId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoriaDTO.Response criar(Long perfilId, CategoriaDTO.Request req) {
        if (repository.existsByPerfilIdAndNomeIgnoreCase(perfilId, req.nome())) {
            throw new IllegalArgumentException("Categoria \"" + req.nome() + "\" já existe.");
        }
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
        Categoria c = Categoria.builder()
            .perfil(perfil).nome(req.nome()).cor(req.cor()).build();
        return toResponse(repository.save(c));
    }

    @Transactional
    public CategoriaDTO.Response atualizar(Long perfilId, Long id, CategoriaDTO.Request req) {
        Categoria c = repository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        if (!c.getNome().equalsIgnoreCase(req.nome())
                && repository.existsByPerfilIdAndNomeIgnoreCase(perfilId, req.nome())) {
            throw new IllegalArgumentException("Categoria \"" + req.nome() + "\" já existe.");
        }
        c.setNome(req.nome());
        c.setCor(req.cor());
        return toResponse(c);
    }

    @Transactional
    public void deletar(Long perfilId, Long id) {
        Categoria c = repository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        repository.delete(c);
    }

    private CategoriaDTO.Response toResponse(Categoria c) {
        return new CategoriaDTO.Response(c.getId(), c.getNome(), c.getCor());
    }
}
