package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NubankFaturaParserTest {

    private final NubankFaturaParser parser = new NubankFaturaParser();

    private InputStream csv(String conteudo) {
        return new ByteArrayInputStream(conteudo.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("converte valor com vírgula decimal e data ISO")
    void converteLinhaSimples() {
        List<LinhaFatura> linhas = parser.parse(csv("""
                date,title,amount
                2026-08-04,Dl*99 Ride,"10,60"
                """));

        assertThat(linhas).singleElement().satisfies(l -> {
            assertThat(l.data()).isEqualTo(LocalDate.of(2026, 8, 4));
            assertThat(l.descricao()).isEqualTo("Dl*99 Ride");
            assertThat(l.valor()).isEqualByComparingTo("10.60");
        });
    }

    @Test
    @DisplayName("descarta pagamento (valor negativo)")
    void descartaPagamento() {
        List<LinhaFatura> linhas = parser.parse(csv("""
                date,title,amount
                2026-07-27,Pagamento recebido,"- 336,40"
                """));

        assertThat(linhas).isEmpty();
    }

    @Test
    @DisplayName("descarta estorno (valor negativo) mas mantém as demais linhas")
    void descartaEstornoEMantemRestante() {
        List<LinhaFatura> linhas = parser.parse(csv("""
                date,title,amount
                2026-01-12,Uber Uber *Trip Help.U,"10,40"
                2026-01-12,"Estorno de \"\"Uber Uber *Trip Help.U\"\"","- 10,40"
                2026-01-11,Dl*99 Ride,"12,50"
                """));

        assertThat(linhas).hasSize(2);
        assertThat(linhas).extracting(LinhaFatura::descricao)
                .containsExactly("Uber Uber *Trip Help.U", "Dl*99 Ride");
    }

    @Test
    @DisplayName("preserva sufixo de parcela como texto, sem tentar interpretá-lo")
    void preservaTextoDeParcela() {
        List<LinhaFatura> linhas = parser.parse(csv("""
                date,title,amount
                2025-12-27,Prontodente Servicos O - Parcela 2/3,"400,00"
                """));

        assertThat(linhas).singleElement()
                .extracting(LinhaFatura::descricao)
                .isEqualTo("Prontodente Servicos O - Parcela 2/3");
    }

    @Test
    @DisplayName("título com vírgula entre aspas não quebra o parsing")
    void tituloComVirgulaEntreAspas() {
        List<LinhaFatura> linhas = parser.parse(csv("""
                date,title,amount
                2026-01-17,"Loja, Filial 2","49,15"
                """));

        assertThat(linhas).singleElement()
                .extracting(LinhaFatura::descricao)
                .isEqualTo("Loja, Filial 2");
    }

    @Test
    @DisplayName("valor ilegível lança InvalidFileFormatException")
    void valorInvalidoLancaExcecao() {
        InputStream in = csv("""
                date,title,amount
                2026-01-17,Loja,"abc"
                """);

        assertThatThrownBy(() -> parser.parse(in))
                .isInstanceOf(InvalidFileFormatException.class);
    }
}
