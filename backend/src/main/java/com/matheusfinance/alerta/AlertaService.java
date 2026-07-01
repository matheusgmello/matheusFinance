package com.matheusfinance.alerta;

import com.matheusfinance.compra.Parcela;
import com.matheusfinance.compra.ParcelaRepository;
import com.matheusfinance.recorrente.PagamentoRecorrente;
import com.matheusfinance.recorrente.RecorrenteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final ParcelaRepository parcelaRepository;
    private final RecorrenteRepository recorrenteRepository;

    @Transactional(readOnly = true)
    public AlertaDTO.Vencimentos vencimentos(Long perfilId, int dias) {
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(dias);

        // Parcelas não pagas: vencidas nos últimos 30 dias ou vencendo nos próximos `dias` dias
        List<Parcela> parcelas = parcelaRepository
            .findPendentesComCompra(perfilId, hoje.minusDays(30), limite);

        List<AlertaDTO.ParcelaVencendo> parcelasDTO = parcelas.stream().map(p ->
            new AlertaDTO.ParcelaVencendo(
                p.getId(),
                p.getCompra().getDescricao(),
                p.getCompra().getCartao().getNome(),
                p.getNumero(),
                p.getCompra().getNumParcelas(),
                p.getValor(),
                p.getDataVencimento(),
                p.getDataVencimento().isBefore(hoje)
            )
        ).toList();

        // Recorrentes ativos cujo dia de vencimento cai dentro da janela (mês atual)
        List<PagamentoRecorrente> recorrentes = recorrenteRepository
            .findAllByPerfilIdAndAtivoTrue(perfilId);

        List<AlertaDTO.RecorrenteVencendo> recorrentesDTO = recorrentes.stream()
            .map(r -> {
                LocalDate venc = proximoVencimento(r.getDiaVencimento(), hoje);
                return new AlertaDTO.RecorrenteVencendo(
                    r.getId(), r.getEmpresa(), r.getValor(), r.getDiaVencimento(), venc);
            })
            .filter(r -> !r.proximoVencimento().isAfter(limite))
            .toList();

        int total = parcelasDTO.size() + recorrentesDTO.size();
        return new AlertaDTO.Vencimentos(total, parcelasDTO, recorrentesDTO);
    }

    private LocalDate proximoVencimento(int dia, LocalDate referencia) {
        int maxDia = referencia.lengthOfMonth();
        LocalDate candidato = referencia.withDayOfMonth(Math.min(dia, maxDia));
        if (!candidato.isBefore(referencia)) return candidato;
        LocalDate proximo = referencia.plusMonths(1);
        return proximo.withDayOfMonth(Math.min(dia, proximo.lengthOfMonth()));
    }
}
