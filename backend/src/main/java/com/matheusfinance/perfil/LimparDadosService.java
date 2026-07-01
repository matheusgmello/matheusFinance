package com.matheusfinance.perfil;

import com.matheusfinance.alertapreco.AlertaPrecoRepository;
import com.matheusfinance.cartao.CartaoRepository;
import com.matheusfinance.categoria.CategoriaRepository;
import com.matheusfinance.compra.CompraRepository;
import com.matheusfinance.compra.ParcelaRepository;
import com.matheusfinance.investimento.InvestmentPositionRepository;
import com.matheusfinance.meta.MetaRepository;
import com.matheusfinance.orcamento.OrcamentoRepository;
import com.matheusfinance.patrimonio.PatrimonioSnapshotRepository;
import com.matheusfinance.receita.ReceitaRepository;
import com.matheusfinance.recorrente.ChecklistRepository;
import com.matheusfinance.recorrente.RecorrenteRepository;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
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
    private final InvestmentPositionRepository investmentPositionRepository;
    private final AlertaPrecoRepository alertaPrecoRepository;
    private final MetaRepository metaRepository;
    private final PatrimonioSnapshotRepository patrimonioSnapshotRepository;
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
        investmentPositionRepository.deleteAllByPerfilId(perfilId);
        alertaPrecoRepository.deleteAllByPerfilId(perfilId);
        metaRepository.deleteAllByPerfilId(perfilId);
        patrimonioSnapshotRepository.deleteAllByPerfilId(perfilId);
        orcamentoRepository.deleteAllByPerfilId(perfilId);
        receitaRepository.deleteAllByPerfilId(perfilId);
        categoriaRepository.deleteAllByPerfilId(perfilId);

        log.warn("Dados do perfil {} foram apagados", perfilId);
    }
}
