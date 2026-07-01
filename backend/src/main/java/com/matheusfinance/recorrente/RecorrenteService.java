package com.matheusfinance.recorrente;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecorrenteService {

    private final RecorrenteRepository recorrenteRepository;
    private final ChecklistRepository checklistRepository;
    private final PerfilRepository perfilRepository;

    @Transactional(readOnly = true)
    public List<RecorrenteDTO.Response> listar(Long perfilId) {
        return recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public RecorrenteDTO.Response criar(RecorrenteDTO.Request req, Long perfilId) {
        Perfil perfil = perfilRepository.findById(perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));
        PagamentoRecorrente recorrente = PagamentoRecorrente.builder()
            .perfil(perfil)
            .empresa(req.empresa())
            .valor(req.valor())
            .diaVencimento(req.diaVencimento())
            .categoria(req.categoria())
            .ativo(true)
            .build();
        return toResponse(recorrenteRepository.save(recorrente));
    }

    @Transactional
    public RecorrenteDTO.Response atualizar(Long id, RecorrenteDTO.Request req, Long perfilId) {
        PagamentoRecorrente r = findOrThrow(id, perfilId);
        r.setEmpresa(req.empresa());
        r.setValor(req.valor());
        r.setDiaVencimento(req.diaVencimento());
        r.setCategoria(req.categoria());
        return toResponse(recorrenteRepository.save(r));
    }

    @Transactional
    public void inativar(Long id, Long perfilId) {
        PagamentoRecorrente r = findOrThrow(id, perfilId);
        r.setAtivo(false);
        recorrenteRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<RecorrenteDTO.ChecklistResponse> checklist(Long perfilId, int ano, int mes) {
        List<PagamentoRecorrente> ativos = recorrenteRepository.findAllByPerfilIdAndAtivoTrue(perfilId);
        return ativos.stream().map(r -> {
            ChecklistRecorrente cl = checklistRepository
                .findByRecorrenteIdAndAnoAndMes(r.getId(), ano, mes)
                .orElse(null);
            return new RecorrenteDTO.ChecklistResponse(
                cl != null ? cl.getId() : null,
                r.getId(), r.getEmpresa(), r.getValor(), r.getDiaVencimento(),
                cl != null && cl.getPago(),
                cl != null ? cl.getPagoEm() : null);
        }).toList();
    }

    @Transactional
    public RecorrenteDTO.ChecklistResponse marcarPago(Long recorrenteId, int ano, int mes,
                                                       boolean pago, Long perfilId) {
        PagamentoRecorrente r = findOrThrow(recorrenteId, perfilId);
        ChecklistRecorrente cl = checklistRepository
            .findByRecorrenteIdAndAnoAndMes(recorrenteId, ano, mes)
            .orElseGet(() -> {
                Perfil perfil = r.getPerfil();
                return ChecklistRecorrente.builder()
                    .recorrente(r).perfil(perfil)
                    .ano(ano).mes(mes).pago(false).build();
            });
        cl.setPago(pago);
        cl.setPagoEm(pago ? OffsetDateTime.now() : null);
        checklistRepository.save(cl);
        return new RecorrenteDTO.ChecklistResponse(
            cl.getId(), r.getId(), r.getEmpresa(), r.getValor(), r.getDiaVencimento(),
            cl.getPago(), cl.getPagoEm());
    }

    private PagamentoRecorrente findOrThrow(Long id, Long perfilId) {
        return recorrenteRepository.findByIdAndPerfilId(id, perfilId)
            .orElseThrow(() -> new ResourceNotFoundException("Recorrente não encontrado: " + id));
    }

    private RecorrenteDTO.Response toResponse(PagamentoRecorrente r) {
        return new RecorrenteDTO.Response(r.getId(), r.getPerfil().getId(),
            r.getEmpresa(), r.getValor(), r.getDiaVencimento(),
            r.getCategoria(), r.getAtivo(), r.getCriadoEm());
    }
}
