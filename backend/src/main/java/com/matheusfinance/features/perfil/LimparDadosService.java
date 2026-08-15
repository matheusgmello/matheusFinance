package com.matheusfinance.features.perfil;

import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.categoria.CategoriaRepository;
import com.matheusfinance.features.compra.CompraRepository;
import com.matheusfinance.features.compra.ParcelaRepository;
import com.matheusfinance.features.meta.MetaRepository;
import com.matheusfinance.features.orcamento.OrcamentoRepository;
import com.matheusfinance.features.receita.ReceitaRepository;
import com.matheusfinance.features.recorrente.ChecklistRepository;
import com.matheusfinance.features.recorrente.RecorrenteRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LimparDadosService {

    private final PerfilRepository perfilRepository;
    private final ParcelaRepository parcelaRepository;
    private final CompraRepository compraRepository;
    private final ChecklistRepository checklistRepository;
    private final RecorrenteRepository recorrenteRepository;
    private final CartaoRepository cartaoRepository;
    private final MetaRepository metaRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final ReceitaRepository receitaRepository;
    private final CategoriaRepository categoriaRepository;

    @Transactional
    public void limpar(Long perfilId, String confirmar) {
        if (!"CONFIRMAR".equals(confirmar)) {
            throw new IllegalArgumentException("Confirmação inválida. Envie o texto 'CONFIRMAR'.");
        }

        perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));

        parcelaRepository.deleteAllByPerfilId(perfilId);
        compraRepository.deleteAllByPerfilId(perfilId);
        checklistRepository.deleteAllByPerfilId(perfilId);
        recorrenteRepository.deleteAllByPerfilId(perfilId);
        cartaoRepository.deleteAllByPerfilId(perfilId);
        metaRepository.deleteAllByPerfilId(perfilId);
        orcamentoRepository.deleteAllByPerfilId(perfilId);
        receitaRepository.deleteAllByPerfilId(perfilId);
        categoriaRepository.deleteAllByPerfilId(perfilId);

        log.warn("Dados do perfil {} foram apagados", perfilId);
    }
}
