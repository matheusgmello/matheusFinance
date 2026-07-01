package com.matheusfinance.alertapreco;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertaPrecoService {

    private final AlertaPrecoRepository repository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<AlertaPrecoDTO.Response> listar(Long perfilId) {
        return repository.findAllByPerfilIdOrderByCriadoEmDesc(perfilId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaPrecoDTO.Response> disparados(Long perfilId) {
        return repository.findAllByPerfilIdAndDisparadoEmIsNotNullAndAtivoTrue(perfilId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public AlertaPrecoDTO.Response criar(Long perfilId, AlertaPrecoDTO.Request req) {
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));
        AlertaPreco alerta = AlertaPreco.builder()
            .perfil(perfil)
            .ticker(req.ticker().toUpperCase())
            .precoAlvo(req.precoAlvo())
            .direcao(req.direcao())
            .build();
        return toResponse(repository.save(alerta));
    }

    @Transactional
    public void dispensar(Long perfilId, Long id) {
        AlertaPreco alerta = repository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + id));
        alerta.setAtivo(false);
        repository.save(alerta);
    }

    @Transactional
    public void deletar(Long perfilId, Long id) {
        AlertaPreco alerta = repository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + id));
        repository.delete(alerta);
    }

    /** Chamado pelo PriceUpdateService após cada atualização de preço. */
    @Transactional
    public void verificarAlertas(String ticker, BigDecimal precoAtual) {
        List<AlertaPreco> alertas = repository.findAllByTickerAndAtivoTrue(ticker.toUpperCase());
        for (AlertaPreco a : alertas) {
            if (a.getDisparadoEm() != null) continue; // já disparou, aguardando dismissal
            boolean disparar = switch (a.getDirecao()) {
                case ACIMA   -> precoAtual.compareTo(a.getPrecoAlvo()) >= 0;
                case ABAIXO  -> precoAtual.compareTo(a.getPrecoAlvo()) <= 0;
            };
            if (disparar) {
                a.setDisparadoEm(OffsetDateTime.now());
                repository.save(a);
                log.info("Alerta disparado: {} {} {} (atual: {})",
                    ticker, a.getDirecao(), a.getPrecoAlvo(), precoAtual);
            }
        }
    }

    private AlertaPrecoDTO.Response toResponse(AlertaPreco a) {
        return new AlertaPrecoDTO.Response(
            a.getId(), a.getTicker(), a.getPrecoAlvo(), a.getDirecao(),
            a.isAtivo(), a.getDisparadoEm(), a.getCriadoEm());
    }
}
