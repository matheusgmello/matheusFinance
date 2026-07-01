package com.matheusfinance.investimento;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

@DisplayName("B3TreasuryParser")
class B3TreasuryParserTest {

    private B3TreasuryParser parser;

    static final String VALID_CSV = """
        Produto;Vencimento;Indexador;Quantidade;Valor Bruto;Valor Atualizado
        Tesouro Selic 2027;01/03/2027;Selic;0,5;1150,00;1100,00
        Tesouro IPCA+ 2035;15/05/2035;IPCA+;1,0;2500,00;2400,00
        Total;;;1,5;3650,00;3500,00
        """;

    static final String CSV_ONLY_TOTAL = """
        Produto;Vencimento;Indexador;Quantidade;Valor Bruto;Valor Atualizado
        Total;;;0,5;1150,00;1100,00
        """;

    @BeforeEach
    void setUp() {
        parser = new B3TreasuryParser();
    }

    @Test
    @DisplayName("supportsHeaders reconhece cabeçalho do Tesouro Direto")
    void supportsHeaders_reconheceTesouro() {
        Set<String> headers = Set.of("Produto", "Vencimento", "Indexador", "Quantidade",
                "Valor Bruto", "Valor Atualizado");
        assertThat(parser.supportsHeaders(headers)).isTrue();
    }

    @Test
    @DisplayName("supportsHeaders rejeita cabeçalho de ações")
    void supportsHeaders_rejeitaAcoes() {
        Set<String> headers = Set.of("Produto", "Código de Negociação", "Instituição",
                "Quantidade", "Preço de Fechamento", "Valor Atualizado");
        assertThat(parser.supportsHeaders(headers)).isFalse();
    }

    @Test
    @DisplayName("parse lê 2 títulos e ignora a linha Total")
    void parse_le2TitulosEIgnoraTotal() throws IOException {
        List<InvestmentDTO.ParsedPosition> positions = parser.parse(toStream(VALID_CSV));

        assertThat(positions).hasSize(2);

        InvestmentDTO.ParsedPosition selic = positions.get(0);
        assertThat(selic.ticker()).isEqualTo("Tesouro Selic 2027");
        assertThat(selic.productName()).isEqualTo("Tesouro Selic 2027");
        assertThat(selic.type()).isEqualTo(InvestmentType.TREASURY);
        assertThat(selic.quantity()).isEqualByComparingTo(new BigDecimal("0.5"));
        assertThat(selic.totalValue()).isEqualByComparingTo(new BigDecimal("1100.00"));
        assertThat(selic.maturityDate()).isEqualTo(LocalDate.of(2027, 3, 1));
        assertThat(selic.indexer()).isEqualTo("Selic");

        InvestmentDTO.ParsedPosition ipca = positions.get(1);
        assertThat(ipca.ticker()).isEqualTo("Tesouro IPCA+ 2035");
        assertThat(ipca.indexer()).isEqualTo("IPCA+");
        assertThat(ipca.maturityDate()).isEqualTo(LocalDate.of(2035, 5, 15));
    }

    @Test
    @DisplayName("parse retorna lista vazia quando só há linha Total")
    void parse_retornaVazioSoTotal() throws IOException {
        List<InvestmentDTO.ParsedPosition> positions = parser.parse(toStream(CSV_ONLY_TOTAL));
        assertThat(positions).isEmpty();
    }

    private ByteArrayInputStream toStream(String csv) {
        return new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));
    }
}
