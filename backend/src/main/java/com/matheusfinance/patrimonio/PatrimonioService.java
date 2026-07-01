package com.matheusfinance.patrimonio;

import com.matheusfinance.investimento.InvestmentPosition;
import com.matheusfinance.investimento.InvestmentPositionRepository;
import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatrimonioService {

    private final PatrimonioSnapshotRepository snapshotRepository;
    private final InvestmentPositionRepository positionRepository;
    private final PerfilRepository perfilRepository;

    // Roda todo dia às 18h (após o fechamento do mercado)
    @Scheduled(cron = "${app.patrimonio-snapshot.cron:0 0 18 * * MON-FRI}")
    @Transactional
    public void tirarSnapshotDiario() {
        LocalDate hoje = LocalDate.now();
        List<Perfil> perfis = perfilRepository.findAll();
        for (Perfil perfil : perfis) {
            tirarSnapshot(perfil, hoje);
        }
        log.info("Snapshots de patrimônio gerados para {} perfis em {}", perfis.size(), hoje);
    }

    @Transactional
    public void tirarSnapshot(Perfil perfil, LocalDate data) {
        List<InvestmentPosition> positions =
                positionRepository.findAllByPerfilIdOrderByTypeAscTickerAsc(perfil.getId());

        if (positions.isEmpty()) return;

        BigDecimal totalInvestido = positions.stream()
                .map(p -> p.getAveragePrice() != null
                        ? p.getAveragePrice().multiply(p.getQuantity())
                        : p.getTotalValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalAtual = positions.stream()
                .map(p -> p.getCurrentPrice() != null
                        ? p.getCurrentPrice().multiply(p.getQuantity())
                        : p.getTotalValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Optional<PatrimonioSnapshot> existing =
                snapshotRepository.findByPerfilIdAndData(perfil.getId(), data);

        PatrimonioSnapshot snapshot = existing.orElseGet(() ->
                PatrimonioSnapshot.builder().perfil(perfil).data(data).build());
        snapshot.setTotalInvestido(totalInvestido);
        snapshot.setTotalAtual(totalAtual);
        snapshotRepository.save(snapshot);
    }

    @Transactional
    public void tirarSnapshotAgora(Long perfilId) {
        perfilRepository.findById(perfilId).ifPresent(p -> tirarSnapshot(p, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public PatrimonioDTO.Historico historico(Long perfilId, int meses) {
        LocalDate fim = LocalDate.now();
        LocalDate inicio = fim.minusMonths(meses);

        List<PatrimonioSnapshot> snapshots =
                snapshotRepository.findAllByPerfilIdAndDataBetweenOrderByData(perfilId, inicio, fim);

        List<PatrimonioDTO.PontoHistorico> pontos = snapshots.stream().map(s -> {
            BigDecimal pnl = s.getTotalAtual().subtract(s.getTotalInvestido());
            String label = s.getData().getDayOfMonth() + " "
                    + s.getData().getMonth().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
            return new PatrimonioDTO.PontoHistorico(s.getData(), label, s.getTotalInvestido(), s.getTotalAtual(), pnl);
        }).toList();

        return new PatrimonioDTO.Historico(meses, pontos);
    }
}
