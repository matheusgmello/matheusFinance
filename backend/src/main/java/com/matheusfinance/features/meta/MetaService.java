package com.matheusfinance.features.meta;

import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetaService {

    private final MetaRepository metaRepository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<MetaDTO.Response> listar(Long perfilId) {
        return metaRepository.findAllByPerfilIdOrderByCriadoEmAsc(perfilId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public MetaDTO.Response criar(Long perfilId, MetaDTO.Request req) {
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));
        Meta meta = Meta.builder()
            .perfil(perfil)
            .nome(req.nome())
            .valorAlvo(req.valorAlvo())
            .valorAtual(req.valorAtual() != null ? req.valorAtual() : BigDecimal.ZERO)
            .prazo(req.prazo())
            .build();
        return toResponse(metaRepository.save(meta));
    }

    @Transactional
    public MetaDTO.Response aportar(Long perfilId, Long id, MetaDTO.AporteRequest req) {
        Meta meta = metaRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada: " + id));
        meta.setValorAtual(meta.getValorAtual().add(req.valor()));
        return toResponse(metaRepository.save(meta));
    }

    @Transactional
    public MetaDTO.Response atualizar(Long perfilId, Long id, MetaDTO.Request req) {
        Meta meta = metaRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada: " + id));
        meta.setNome(req.nome());
        meta.setValorAlvo(req.valorAlvo());
        if (req.valorAtual() != null) meta.setValorAtual(req.valorAtual());
        meta.setPrazo(req.prazo());
        return toResponse(metaRepository.save(meta));
    }

    @Transactional
    public void deletar(Long perfilId, Long id) {
        Meta meta = metaRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Meta não encontrada: " + id));
        metaRepository.delete(meta);
    }

    private MetaDTO.Response toResponse(Meta m) {
        BigDecimal faltam = m.getValorAlvo().subtract(m.getValorAtual()).max(BigDecimal.ZERO);
        double pct = m.getValorAlvo().compareTo(BigDecimal.ZERO) == 0 ? 0 :
            m.getValorAtual().divide(m.getValorAlvo(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue();

        // Projeção de conclusão: baseada na velocidade de aporte diária desde criação
        LocalDate previsao = calcularPrevisao(m, faltam);

        return new MetaDTO.Response(
            m.getId(), m.getNome(), m.getValorAlvo(), m.getValorAtual(),
            faltam, Math.min(pct, 100.0), m.getPrazo(), previsao);
    }

    private LocalDate calcularPrevisao(Meta m, BigDecimal faltam) {
        if (faltam.compareTo(BigDecimal.ZERO) == 0) return LocalDate.now();
        long diasDecorridos = ChronoUnit.DAYS.between(m.getCriadoEm().toLocalDate(), LocalDate.now());
        if (diasDecorridos <= 0 || m.getValorAtual().compareTo(BigDecimal.ZERO) == 0) return null;
        // taxa diária = valorAtual / diasDecorridos
        BigDecimal taxaDiaria = m.getValorAtual().divide(BigDecimal.valueOf(diasDecorridos), 2, RoundingMode.HALF_UP);
        if (taxaDiaria.compareTo(BigDecimal.ZERO) == 0) return null;
        long diasRestantes = faltam.divide(taxaDiaria, 0, RoundingMode.CEILING).longValue();
        return LocalDate.now().plusDays(diasRestantes);
    }
}
