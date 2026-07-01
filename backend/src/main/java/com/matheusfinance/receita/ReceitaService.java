package com.matheusfinance.receita;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ReceitaService {

    private final ReceitaRepository repository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public ReceitaDTO.Response buscar(Long perfilId, int ano, int mes) {
        return repository.findByPerfilIdAndAnoAndMes(perfilId, ano, mes)
            .map(r -> new ReceitaDTO.Response(r.getAno(), r.getMes(), r.getValor()))
            .orElse(new ReceitaDTO.Response(ano, mes, BigDecimal.ZERO));
    }

    @Transactional
    public ReceitaDTO.Response salvar(Long perfilId, int ano, int mes, ReceitaDTO.Request req) {
        Receita receita = repository.findByPerfilIdAndAnoAndMes(perfilId, ano, mes)
            .orElseGet(() -> {
                Perfil perfil = perfilRepository.findById(perfilId)
                    .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
                return Receita.builder().perfil(perfil).ano(ano).mes(mes).build();
            });
        receita.setValor(req.valor());
        repository.save(receita);
        return new ReceitaDTO.Response(ano, mes, receita.getValor());
    }
}
