package com.matheusfinance.features.perfil;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.compra.CompraParcelada;
import com.matheusfinance.features.compra.CompraRepository;
import com.matheusfinance.features.compra.Parcela;
import com.matheusfinance.features.investimento.InvestmentPosition;
import com.matheusfinance.features.investimento.InvestmentPositionRepository;
import com.matheusfinance.features.investimento.InvestmentType;
import com.matheusfinance.features.recorrente.ChecklistRecorrente;
import com.matheusfinance.features.recorrente.ChecklistRepository;
import com.matheusfinance.features.recorrente.PagamentoRecorrente;
import com.matheusfinance.features.recorrente.RecorrenteRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerfilExportImportService {

    private final PerfilRepository perfilRepository;
    private final CartaoRepository cartaoRepository;
    private final CompraRepository compraRepository;
    private final RecorrenteRepository recorrenteRepository;
    private final ChecklistRepository checklistRepository;
    private final InvestmentPositionRepository investmentPositionRepository;

    // ── Export ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PerfilBackupDTO.Backup exportar(Long perfilId) {
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado: " + perfilId));

        List<Cartao> cartoes = cartaoRepository.findAllByPerfilId(perfilId);
        Map<Long, Integer> cartaoIndexMap = new HashMap<>();
        for (int i = 0; i < cartoes.size(); i++) {
            cartaoIndexMap.put(cartoes.get(i).getId(), i);
        }

        List<CompraParcelada> compras = compraRepository.findAllByPerfilIdWithParcelas(perfilId);
        List<PagamentoRecorrente> recorrentes = recorrenteRepository.findAllByPerfilId(perfilId);
        List<ChecklistRecorrente> todosChecklist = checklistRepository.findAllByPerfilId(perfilId);
        List<InvestmentPosition> investimentos =
                investmentPositionRepository.findAllByPerfilIdOrderByTypeAscTickerAsc(perfilId);

        Map<Long, List<ChecklistRecorrente>> checklistPorRecorrente = todosChecklist.stream()
                .collect(Collectors.groupingBy(cl -> cl.getRecorrente().getId()));

        List<PerfilBackupDTO.CartaoData> cartaoDatas = cartoes.stream()
                .map(c -> new PerfilBackupDTO.CartaoData(c.getNome(), c.getDiaVencimento(), c.getDiaFechamento()))
                .toList();

        List<PerfilBackupDTO.CompraData> compraDatas = compras.stream().map(c -> {
            int idx = cartaoIndexMap.getOrDefault(c.getCartao().getId(), 0);
            List<PerfilBackupDTO.ParcelaData> parcelaDatas = c.getParcelas().stream()
                    .map(p -> new PerfilBackupDTO.ParcelaData(
                            p.getNumero(), p.getValor(), p.getDataVencimento(),
                            p.getPaga(), p.getPagaEm()))
                    .toList();
            return new PerfilBackupDTO.CompraData(
                    idx, c.getDescricao(), c.getValorTotal(), c.getNumParcelas(),
                    c.getDataCompra(), c.getCategoria(), parcelaDatas);
        }).toList();

        List<PerfilBackupDTO.RecorrenteData> recorrenteDatas = recorrentes.stream().map(r -> {
            List<PerfilBackupDTO.ChecklistData> clDatas =
                    checklistPorRecorrente.getOrDefault(r.getId(), List.of()).stream()
                            .map(cl -> new PerfilBackupDTO.ChecklistData(
                                    cl.getAno(), cl.getMes(), cl.getPago(), cl.getPagoEm()))
                            .toList();
            return new PerfilBackupDTO.RecorrenteData(
                    r.getEmpresa(), r.getValor(), r.getDiaVencimento(),
                    r.getCategoria(), r.getAtivo(), clDatas);
        }).toList();

        List<PerfilBackupDTO.InvestimentoData> investimentoDatas = investimentos.stream()
                .map(i -> new PerfilBackupDTO.InvestimentoData(
                        i.getTicker(), i.getProductName(), i.getType().name(),
                        i.getQuantity(), i.getAveragePrice(), i.getCurrentPrice(),
                        i.getTotalValue(), i.getInstitution(), i.getMaturityDate(),
                        i.getIndexer(), i.getReferenceDate()))
                .toList();

        return new PerfilBackupDTO.Backup(
                "1", OffsetDateTime.now(), perfil.getNome(),
                cartaoDatas, compraDatas, recorrenteDatas, investimentoDatas);
    }

    // ── Import ────────────────────────────────────────────────────────────────

    @Transactional
    public Long importar(PerfilBackupDTO.Backup backup) {
        Perfil perfil = perfilRepository.save(
                Perfil.builder().nome(backup.perfilNome()).build());

        // Cartões — mapa por índice para referenciar nas compras
        List<Cartao> cartoesSalvos = new ArrayList<>();
        for (var cd : backup.cartoes()) {
            Cartao c = cartaoRepository.save(Cartao.builder()
                    .perfil(perfil)
                    .nome(cd.nome())
                    .diaVencimento(cd.diaVencimento())
                    .diaFechamento(cd.diaFechamento())
                    .build());
            cartoesSalvos.add(c);
        }

        // Compras + Parcelas (valores preservados do backup, sem recalcular)
        for (var cd : backup.compras()) {
            Cartao cartao = cartoesSalvos.isEmpty()
                    ? null
                    : cartoesSalvos.get(Math.min(cd.cartaoIndex(), cartoesSalvos.size() - 1));

            CompraParcelada compra = CompraParcelada.builder()
                    .perfil(perfil).cartao(cartao)
                    .descricao(cd.descricao()).valorTotal(cd.valorTotal())
                    .numParcelas(cd.numParcelas()).dataCompra(cd.dataCompra())
                    .categoria(cd.categoria())
                    .build();

            for (var pd : cd.parcelas()) {
                compra.getParcelas().add(Parcela.builder()
                        .compra(compra).perfil(perfil)
                        .numero(pd.numero()).valor(pd.valor())
                        .dataVencimento(pd.dataVencimento())
                        .paga(pd.paga()).pagaEm(pd.pagaEm())
                        .build());
            }
            compraRepository.save(compra);
        }

        // Recorrentes + Checklist
        for (var rd : backup.recorrentes()) {
            PagamentoRecorrente recorrente = recorrenteRepository.save(
                    PagamentoRecorrente.builder()
                            .perfil(perfil).empresa(rd.empresa()).valor(rd.valor())
                            .diaVencimento(rd.diaVencimento()).categoria(rd.categoria())
                            .ativo(rd.ativo())
                            .build());

            for (var cl : rd.checklist()) {
                checklistRepository.save(ChecklistRecorrente.builder()
                        .recorrente(recorrente).perfil(perfil)
                        .ano(cl.ano()).mes(cl.mes())
                        .pago(cl.pago()).pagoEm(cl.pagoEm())
                        .build());
            }
        }

        // Investimentos
        for (var id : backup.investimentos()) {
            if (!investmentPositionRepository.existsByPerfilIdAndTickerAndReferenceDate(
                    perfil.getId(), id.ticker(), id.referenceDate())) {
                investmentPositionRepository.save(InvestmentPosition.builder()
                        .perfil(perfil).ticker(id.ticker()).productName(id.productName())
                        .type(InvestmentType.valueOf(id.type()))
                        .quantity(id.quantity()).averagePrice(id.averagePrice())
                        .currentPrice(id.currentPrice()).totalValue(id.totalValue())
                        .institution(id.institution()).maturityDate(id.maturityDate())
                        .indexer(id.indexer()).referenceDate(id.referenceDate())
                        .build());
            }
        }

        return perfil.getId();
    }
}
