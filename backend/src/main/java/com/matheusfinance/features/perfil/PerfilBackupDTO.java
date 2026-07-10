package com.matheusfinance.features.perfil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class PerfilBackupDTO {

    public record Backup(
            String version,
            OffsetDateTime exportedAt,
            String perfilNome,
            List<CartaoData> cartoes,
            List<CompraData> compras,
            List<RecorrenteData> recorrentes,
            List<InvestimentoData> investimentos
    ) {}

    public record CartaoData(
            String nome,
            int diaVencimento,
            int diaFechamento
    ) {}

    public record CompraData(
            int cartaoIndex,
            String descricao,
            BigDecimal valorTotal,
            int numParcelas,
            LocalDate dataCompra,
            String categoria,
            List<ParcelaData> parcelas
    ) {}

    public record ParcelaData(
            int numero,
            BigDecimal valor,
            LocalDate dataVencimento,
            boolean paga,
            OffsetDateTime pagaEm
    ) {}

    public record RecorrenteData(
            String empresa,
            BigDecimal valor,
            int diaVencimento,
            String categoria,
            boolean ativo,
            List<ChecklistData> checklist
    ) {}

    public record ChecklistData(
            int ano,
            int mes,
            boolean pago,
            OffsetDateTime pagoEm
    ) {}

    public record InvestimentoData(
            String ticker,
            String productName,
            String type,
            BigDecimal quantity,
            BigDecimal averagePrice,
            BigDecimal currentPrice,
            BigDecimal totalValue,
            String institution,
            LocalDate maturityDate,
            String indexer,
            LocalDate referenceDate
    ) {}
}
