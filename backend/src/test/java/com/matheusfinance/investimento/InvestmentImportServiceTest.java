package com.matheusfinance.investimento;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.exception.InvalidFileFormatException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InvestmentImportService")
class InvestmentImportServiceTest {

    @Mock InvestmentPositionRepository repository;
    @Mock PerfilRepository perfilRepository;
    @Mock B3XlsxParser xlsxParser;
    @Mock PnlCalculator pnlCalculator;

    private InvestmentImportService service;

    static final LocalDate REF_DATE = LocalDate.of(2025, 4, 30);
    static final Long PERFIL_ID = 1L;
    static final Perfil PERFIL = Perfil.builder().id(PERFIL_ID).nome("Teste").build();

    static final String CSV = """
        Produto;Código de Negociação;Instituição;Quantidade;Preço de Fechamento;Valor Atualizado
        BANCO DO BRASIL ON ED N1;BBAS3;XP INVESTIMENTOS;100;45,78;4578,00
        ITAU UNIBANCO PN N1;ITUB4;XP INVESTIMENTOS;200;32,50;6500,00
        """;

    @BeforeEach
    void setUp() {
        List<B3FileParser> parsers = List.of(new B3StockFiiParser(), new B3TreasuryParser());
        service = new InvestmentImportService(repository, perfilRepository, parsers, xlsxParser, pnlCalculator);
        when(perfilRepository.findById(PERFIL_ID)).thenReturn(Optional.of(PERFIL));
    }

    @Test
    @DisplayName("importa 2 posições novas e retorna imported=2, skipped=0")
    void importa2PosicoesNovas() throws IOException {
        when(repository.existsByPerfilIdAndTickerAndReferenceDate(eq(PERFIL_ID), anyString(), eq(REF_DATE)))
                .thenReturn(false);

        InvestmentDTO.ImportResult result = service.importFile(PERFIL_ID, REF_DATE, toBytes(CSV));

        assertThat(result.imported()).isEqualTo(2);
        assertThat(result.skipped()).isEqualTo(0);
        verify(repository, times(2)).save(any(InvestmentPosition.class));
    }

    @Test
    @DisplayName("segunda importação do mesmo arquivo é idempotente: imported=0, skipped=2")
    void segundaImportacaoEhIdempotente() throws IOException {
        when(repository.existsByPerfilIdAndTickerAndReferenceDate(eq(PERFIL_ID), anyString(), eq(REF_DATE)))
                .thenReturn(true);

        InvestmentDTO.ImportResult result = service.importFile(PERFIL_ID, REF_DATE, toBytes(CSV));

        assertThat(result.imported()).isEqualTo(0);
        assertThat(result.skipped()).isEqualTo(2);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("importação parcial: 1 nova e 1 duplicada")
    void importacaoParcial_1nova1duplicada() throws IOException {
        when(repository.existsByPerfilIdAndTickerAndReferenceDate(PERFIL_ID, "BBAS3", REF_DATE)).thenReturn(true);
        when(repository.existsByPerfilIdAndTickerAndReferenceDate(PERFIL_ID, "ITUB4", REF_DATE)).thenReturn(false);

        InvestmentDTO.ImportResult result = service.importFile(PERFIL_ID, REF_DATE, toBytes(CSV));

        assertThat(result.imported()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(1);
        verify(repository, times(1)).save(any(InvestmentPosition.class));
    }

    @Test
    @DisplayName("arquivo com cabeçalho desconhecido lança InvalidFileFormatException")
    void cabecalhoDesconhecido_lancaExcecao() {
        byte[] unknownCsv = "ColX;ColY\nfoo;bar\n".getBytes();

        assertThatThrownBy(() -> service.importFile(PERFIL_ID, REF_DATE, unknownCsv))
                .isInstanceOf(InvalidFileFormatException.class)
                .hasMessageContaining("não reconhecido");
    }

    private byte[] toBytes(String csv) {
        return csv.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
