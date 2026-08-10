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
            List<CategoriaData> categorias,
            List<OrcamentoData> orcamentos,
            List<ReceitaData> receitas,
            List<MetaData> metas
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

    public record CategoriaData(
            String nome,
            String cor
    ) {}

    public record OrcamentoData(
            String categoria,
            BigDecimal valorLimite
    ) {}

    public record ReceitaData(
            int ano,
            int mes,
            BigDecimal valor
    ) {}

    public record MetaData(
            String nome,
            BigDecimal valorAlvo,
            BigDecimal valorAtual,
            LocalDate prazo
    ) {}
}
