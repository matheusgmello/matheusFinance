package com.matheusfinance.investimento;

import com.matheusfinance.shared.exception.InvalidFileFormatException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@DisplayName("B3StockFiiParser")
class B3StockFiiParserTest {

    private B3StockFiiParser parser;

    static final String VALID_CSV = """
        Produto;Código de Negociação;Instituição;Quantidade;Preço de Fechamento;Valor Atualizado
        BANCO DO BRASIL ON ED N1;BBAS3;XP INVESTIMENTOS;100;45,78;4578,00
        ITAU UNIBANCO PN N1;ITUB4;XP INVESTIMENTOS;200;32,50;6500,00
        CSHG LOGISTICA FII;HGLG11;XP INVESTIMENTOS;50;165,00;8250,00
        """;

    static final String CSV_WITH_SPACES_IN_TICKER = """
        Produto;Código de Negociação;Instituição;Quantidade;Preço de Fechamento;Valor Atualizado
        PETROBRAS PN;  PETR4 ;CLEAR;300;38,20;11460,00
        """;

    static final String INVALID_HEADER_CSV = """
        Coluna1;Coluna2;Coluna3
        foo;bar;baz
        """;

    @BeforeEach
    void setUp() {
        parser = new B3StockFiiParser();
    }

    @Test
    @DisplayName("supportsHeaders reconhece cabeçalho de ações/FIIs")
    void supportsHeaders_reconheceAcoesFii() {
        Set<String> headers = Set.of("Produto", "Código de Negociação", "Instituição",
                "Quantidade", "Preço de Fechamento", "Valor Atualizado");
        assertThat(parser.supportsHeaders(headers)).isTrue();
    }

    @Test
    @DisplayName("supportsHeaders rejeita cabeçalho de tesouro direto")
    void supportsHeaders_rejeitaTesouro() {
        Set<String> headers = Set.of("Produto", "Vencimento", "Indexador", "Quantidade",
                "Valor Bruto", "Valor Atualizado");
        assertThat(parser.supportsHeaders(headers)).isFalse();
    }

    @Test
    @DisplayName("parse lê 3 ativos corretamente com tipos corretos")
    void parse_le3AtivosComTiposCorretos() throws IOException {
        List<InvestmentDTO.ParsedPosition> positions = parser.parse(toStream(VALID_CSV));

        assertThat(positions).hasSize(3);

        InvestmentDTO.ParsedPosition bbas3 = positions.get(0);
        assertThat(bbas3.ticker()).isEqualTo("BBAS3");
        assertThat(bbas3.type()).isEqualTo(InvestmentType.STOCK);
        assertThat(bbas3.quantity()).isEqualByComparingTo(new BigDecimal("100"));
        assertThat(bbas3.currentPrice()).isEqualByComparingTo(new BigDecimal("45.78"));
        assertThat(bbas3.totalValue()).isEqualByComparingTo(new BigDecimal("4578.00"));
        assertThat(bbas3.institution()).isEqualTo("XP INVESTIMENTOS");

        InvestmentDTO.ParsedPosition hglg11 = positions.get(2);
        assertThat(hglg11.ticker()).isEqualTo("HGLG11");
        assertThat(hglg11.type()).isEqualTo(InvestmentType.FII);
    }

    @Test
    @DisplayName("parse remove espaços do ticker")
    void parse_removeEspacosDoCodigo() throws IOException {
        List<InvestmentDTO.ParsedPosition> positions = parser.parse(toStream(CSV_WITH_SPACES_IN_TICKER));

        assertThat(positions).hasSize(1);
        assertThat(positions.get(0).ticker()).isEqualTo("PETR4");
    }

    @Test
    @DisplayName("parse lança InvalidFileFormatException para cabeçalho inválido")
    void parse_lancaExcecaoParaCabecalhoInvalido() {
        assertThatThrownBy(() -> parser.parse(toStream(INVALID_HEADER_CSV)))
                .isInstanceOf(InvalidFileFormatException.class)
                .hasMessageContaining("Código de Negociação");
    }

    private ByteArrayInputStream toStream(String csv) {
        return new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    }
}
