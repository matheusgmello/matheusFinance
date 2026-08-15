package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Fixture de texto abaixo é o resultado real de
 * PDFTextStripper.setSortByPosition(false) numa fatura Itaú real (dados
 * substituídos por valores fictícios) — não o PDF em si, que não entra no
 * repositório.
 */
class ItauFaturaPdfParserTest {

    private final ItauFaturaPdfParser parser = new ItauFaturaPdfParser();

    private static final String TEXTO_REAL = """
            Pagamentos efetuados
            DATA VALOR EM R$
            03/07 Pagamento via conta -208,37
            Total dos pagamentos -208,37
            Lançamentos: compras e saques
            MATHEUS GABRIEL F MELLO
            DATA ESTABELECIMENTO VALOR EM R$
            08/11 MLP    *KaBuM- 09/09 144,47
            eletronicos  Limeira
            24/07 AMAZON BRSAO P 01/02 62,10
            vestuário  SAO PAULO
            01/08 SHOPEE *SenraR 01/02 121,58
            serviços  Claudio
            Lançamentos no cartão 328,15
            Total dos lançamentos atuais 328,15
            Compras parceladas - próximas faturas
            DATA ESTABELECIMENTO VALOR EM R$
            24/07 AMAZON BRSAO P 02/02 62,09
            01/08 SHOPEE *SenraR 02/02 121,58
            Próxima fatura 183,67
            Demais faturas 0,00
            Total para próximas faturas 183,67
            Limites de crédito Valor em R$
            Limite total de crédito 2.880,00
            """;

    @Test
    @DisplayName("separa lançamentos atuais de próxima fatura em listas diferentes")
    void separaSecoes() {
        var resultado = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(resultado.atual()).hasSize(3);
        assertThat(resultado.proximaFatura()).hasSize(2);
    }

    @Test
    @DisplayName("linha com parcela: data, estabelecimento e valor corretos, mês igual ao de referência")
    void parcelaMesmoAno() {
        var resultado = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        LinhaFatura amazon = resultado.atual().stream()
                .filter(l -> l.descricao().startsWith("AMAZON"))
                .findFirst().orElseThrow();

        assertThat(amazon.data()).isEqualTo(LocalDate.of(2026, 7, 24));
        assertThat(amazon.descricao()).isEqualTo("AMAZON BRSAO P - Parcela 01/02");
        assertThat(amazon.valor()).isEqualByComparingTo("62.10");
    }

    @Test
    @DisplayName("mês da transação maior que o mês de referência vira ano anterior")
    void mesPosteriorViraAnoAnterior() {
        var resultado = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        LinhaFatura kabum = resultado.atual().stream()
                .filter(l -> l.descricao().contains("KaBuM"))
                .findFirst().orElseThrow();

        assertThat(kabum.data()).isEqualTo(LocalDate.of(2025, 11, 8));
        assertThat(kabum.descricao()).isEqualTo("MLP *KaBuM- - Parcela 09/09");
    }

    @Test
    @DisplayName("próxima fatura usa o mesmo mês de referência para resolver o ano da data")
    void proximaFaturaResolveAnoIgualAoAtual() {
        var resultado = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(resultado.proximaFatura())
                .allSatisfy(l -> assertThat(l.data().getYear()).isEqualTo(2026));
    }

    @Test
    @DisplayName("linhas fora de qualquer seção (total, cabeçalho, pagamento) são ignoradas")
    void ignoraLinhasForaDeSecao() {
        var resultado = parser.parseTexto(TEXTO_REAL, YearMonth.of(2026, 8));

        assertThat(resultado.atual()).noneMatch(l -> l.descricao().contains("Pagamento"));
        assertThat(resultado.atual()).allSatisfy(l -> assertThat(l.valor()).isPositive());
    }

    @Test
    @DisplayName("linha sem parcela: dois tokens de descrição, valor no fim")
    void semParcela() {
        String texto = """
                Lançamentos: compras e saques
                DATA ESTABELECIMENTO VALOR EM R$
                15/08 Padaria Sao Jose 23,50
                Lançamentos no cartão 23,50
                """;

        var resultado = parser.parseTexto(texto, YearMonth.of(2026, 8));

        assertThat(resultado.atual()).singleElement().satisfies(l -> {
            assertThat(l.descricao()).isEqualTo("Padaria Sao Jose");
            assertThat(l.valor()).isEqualByComparingTo("23.50");
        });
    }

    @Test
    @DisplayName("linha com prefixo de data mas sem valor no fim lança InvalidFileFormatException")
    void linhaMalformadaLancaExcecao() {
        String texto = """
                Lançamentos: compras e saques
                DATA ESTABELECIMENTO VALOR EM R$
                15/08 Padaria Sao Jose sem-valor-aqui
                """;

        assertThatThrownBy(() -> parser.parseTexto(texto, YearMonth.of(2026, 8)))
                .isInstanceOf(InvalidFileFormatException.class);
    }

    @Test
    @DisplayName("valor com separador de milhar é convertido corretamente")
    void valorComMilhar() {
        String texto = """
                Lançamentos: compras e saques
                DATA ESTABELECIMENTO VALOR EM R$
                10/08 Loja Grande 1.234,56
                """;

        var resultado = parser.parseTexto(texto, YearMonth.of(2026, 8));

        assertThat(resultado.atual()).singleElement()
                .extracting(LinhaFatura::valor)
                .isEqualTo(new BigDecimal("1234.56"));
    }
}
