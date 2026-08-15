package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Fixture de texto abaixo é o resultado real de
 * PDFTextStripper.setSortByPosition(false) numa fatura Nubank fechada real
 * (dados substituídos por valores fictícios) — não o PDF em si, que não
 * entra no repositório.
 */
class NubankFaturaPdfParserTest {

    private final NubankFaturaPdfParser parser = new NubankFaturaPdfParser();

    private static final String TEXTO_REAL = """
            FATURA 03 AGO 2026 EMISSÃO E ENVIO 27 JUL 2026
            RESUMO DA FATURA ATUAL
            Fatura anterior R$ 0,00
            PRÓXIMAS FATURAS
            Fechamento da próxima fatura 27 AGO 2026
            Saldo em aberto da próxima fatura R$ 0,00
            TRANSAÇÕES DE 26 JUN A 27 JUL
            Matheus G F Mello R$ 336,40
            26 JUN Plano NuCel R$ 30,00
            26 JUN iFood - NuPay R$ 80,23
            28 JUN •••• 6150 Uber Uber *Trip Help.U R$ 13,95
            28 JUN •••• 6150 Dl*99 Ride R$ 10,25
            04 JUL •••• 6150 Totalpass R$ 139,90
            05 JUL •••• 6150 Dm*Spotify R$ 12,90
            07 JUL •••• 6150 Dl*99 Ride R$ 9,90
            08 JUL •••• 6150 Dl*99 Ride R$ 9,27
            26 JUL Plano NuCel R$ 30,00
            Pagamentos R$ 0,00
            """;

    @Test
    @DisplayName("extrai as 9 transações reais, ignorando cabeçalho, resumo e linha de pagamentos")
    void extraiTransacoesReais() {
        List<LinhaFatura> linhas = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(linhas).hasSize(9);
        assertThat(linhas).noneMatch(l -> l.descricao().contains("Pagamentos"));
    }

    @Test
    @DisplayName("linha sem marcador de cartão: data, estabelecimento e valor corretos")
    void semMarcadorDeCartao() {
        List<LinhaFatura> linhas = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        LinhaFatura plano = linhas.stream()
                .filter(l -> l.data().equals(LocalDate.of(2026, 6, 26)))
                .findFirst().orElseThrow();

        assertThat(plano.descricao()).isEqualTo("Plano NuCel");
        assertThat(plano.valor()).isEqualByComparingTo("30.00");
    }

    @Test
    @DisplayName("marcador de cartão (•••• NNNN) é descartado da descrição")
    void descartaMarcadorDeCartao() {
        List<LinhaFatura> linhas = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        LinhaFatura uber = linhas.stream()
                .filter(l -> l.descricao().startsWith("Uber"))
                .findFirst().orElseThrow();

        assertThat(uber.descricao()).isEqualTo("Uber Uber *Trip Help.U");
        assertThat(uber.descricao()).doesNotContain("6150");
        assertThat(uber.valor()).isEqualByComparingTo("13.95");
    }

    @Test
    @DisplayName("estabelecimento com hífen (iFood - NuPay) não quebra o parsing")
    void estabelecimentoComHifen() {
        List<LinhaFatura> linhas = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(linhas).anySatisfy(l -> {
            assertThat(l.descricao()).isEqualTo("iFood - NuPay");
            assertThat(l.valor()).isEqualByComparingTo("80.23");
        });
    }

    @Test
    @DisplayName("mês da transação igual ao mês de referência não sofre virada de ano")
    void mesmoAnoDoMesReferencia() {
        List<LinhaFatura> linhas = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(linhas).allSatisfy(l -> assertThat(l.data().getYear()).isEqualTo(2026));
    }

    @Test
    @DisplayName("linha com prefixo de data mas sem R$ no fim lança InvalidFileFormatException")
    void linhaMalformadaLancaExcecao() {
        String texto = """
                TRANSAÇÕES DE 01 AGO A 31 AGO
                15 AGO Padaria Sao Jose sem-valor-aqui
                """;

        assertThatThrownBy(() -> parser.parseTexto(texto, YearMonth.of(2026, 8)))
                .isInstanceOf(InvalidFileFormatException.class);
    }

    @Test
    @DisplayName("mês da transação posterior ao de referência vira ano anterior")
    void mesPosteriorViraAnoAnterior() {
        String texto = """
                TRANSAÇÕES DE 01 JAN A 31 JAN
                15 NOV Compra Antiga R$ 50,00
                """;

        List<LinhaFatura> linhas = parser.parseTexto(texto, YearMonth.of(2026, 1));

        assertThat(linhas).singleElement()
                .extracting(LinhaFatura::data)
                .isEqualTo(LocalDate.of(2025, 11, 15));
    }
}
