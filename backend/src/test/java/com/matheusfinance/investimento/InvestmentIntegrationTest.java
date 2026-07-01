package com.matheusfinance.investimento;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("Investment API — Integration Tests")
class InvestmentIntegrationTest {

    @LocalServerPort int port;

    RestTemplate rest;
    String baseUrl;
    long perfilId;
    String jwtToken;

    static final String TEST_PIN = "1234";

    static final String STOCKS_CSV = """
        Produto;Código de Negociação;Instituição;Quantidade;Preço de Fechamento;Valor Atualizado
        BANCO DO BRASIL ON ED N1;BBAS3;XP INVESTIMENTOS;100;45,78;4578,00
        CSHG LOGISTICA FII;HGLG11;XP INVESTIMENTOS;50;165,00;8250,00
        """;

    static final String TREASURY_CSV = """
        Produto;Vencimento;Indexador;Quantidade;Valor Bruto;Valor Atualizado
        Tesouro Selic 2027;01/03/2027;Selic;0,5;1150,00;1100,00
        Total;;;0,5;1150,00;1100,00
        """;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        rest = new RestTemplate();
        baseUrl = "http://localhost:" + port;

        HttpHeaders jsonHeaders = new HttpHeaders();
        jsonHeaders.setContentType(MediaType.APPLICATION_JSON);

        // 1. Criar perfil
        var res = rest.postForEntity(
                baseUrl + "/api/perfis",
                new HttpEntity<>(Map.of("nome", "Investidor Teste"), jsonHeaders),
                Map.class
        );
        perfilId = ((Number) res.getBody().get("id")).longValue();

        // 2. Login inicial — sem PIN → retorna setup token
        var loginRes = rest.postForEntity(
                baseUrl + "/api/auth/login",
                new HttpEntity<>(Map.of("perfilId", perfilId), jsonHeaders),
                Map.class
        );
        String setupToken = (String) loginRes.getBody().get("token");

        // 3. Criar PIN com setup token
        HttpHeaders setupHeaders = new HttpHeaders();
        setupHeaders.setContentType(MediaType.APPLICATION_JSON);
        setupHeaders.set("Authorization", "Bearer " + setupToken);
        setupHeaders.set("X-Perfil-Id", String.valueOf(perfilId));
        rest.postForEntity(
                baseUrl + "/api/auth/setup-pin",
                new HttpEntity<>(Map.of("pin", TEST_PIN, "confirmar", TEST_PIN), setupHeaders),
                Map.class
        );

        // 4. Login com PIN → JWT completo
        var authRes = rest.postForEntity(
                baseUrl + "/api/auth/login",
                new HttpEntity<>(Map.of("perfilId", perfilId, "pin", TEST_PIN), jsonHeaders),
                Map.class
        );
        jwtToken = (String) authRes.getBody().get("token");
    }

    @Test
    @DisplayName("POST /import com arquivo de ações retorna imported=2, skipped=0")
    void importStocks_retorna2Importados() {
        var result = importFile(STOCKS_CSV, "acoes.csv", perfilId, "2025-04-30");

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().get("imported")).isEqualTo(2);
        assertThat(result.getBody().get("skipped")).isEqualTo(0);
    }

    @Test
    @DisplayName("segunda importação do mesmo arquivo é idempotente: imported=0, skipped=2")
    void importStocks_duasVezesEhIdempotente() {
        importFile(STOCKS_CSV, "acoes.csv", perfilId, "2025-04-30");
        var result = importFile(STOCKS_CSV, "acoes.csv", perfilId, "2025-04-30");

        assertThat(result.getBody().get("imported")).isEqualTo(0);
        assertThat(result.getBody().get("skipped")).isEqualTo(2);
    }

    @Test
    @DisplayName("POST /import com arquivo Tesouro Direto ignora linha Total")
    void importTreasury_ignoraLinhaTotal() {
        var result = importFile(TREASURY_CSV, "tesouro.csv", perfilId, "2025-04-30");

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(result.getBody().get("imported")).isEqualTo(1);
        assertThat(result.getBody().get("skipped")).isEqualTo(0);
    }

    @Test
    @DisplayName("POST /import com arquivo inválido retorna 400")
    void importArquivoInvalido_retorna400() {
        assertThatThrownBy(() -> importFile("colA;colB\nfoo;bar\n", "lixo.csv", perfilId, "2025-04-30"))
                .isInstanceOf(HttpClientErrorException.BadRequest.class);
    }

    @Test
    @DisplayName("GET /summary retorna totais por tipo após importação")
    void getSummary_retornaTotaisCorretos() {
        importFile(STOCKS_CSV, "acoes.csv", perfilId, "2025-04-30");

        var response = rest.exchange(
                baseUrl + "/api/v1/investments/summary",
                HttpMethod.GET,
                new HttpEntity<>(authHeaders()),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("grandTotal");
        List<?> positions = (List<?>) response.getBody().get("positions");
        assertThat(positions).hasSize(2);
    }

    // --- helpers ---

    private HttpHeaders authHeaders() {
        HttpHeaders h = new HttpHeaders();
        h.set("Authorization", "Bearer " + jwtToken);
        h.set("X-Perfil-Id", String.valueOf(perfilId));
        return h;
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<Map> importFile(String csv, String filename, long perfilId, String referenceDate) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new NamedByteArrayResource(csv.getBytes(StandardCharsets.UTF_8), filename));

        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        return rest.exchange(
                baseUrl + "/api/v1/investments/import?referenceDate=" + referenceDate,
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class
        );
    }

    static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;
        NamedByteArrayResource(byte[] bytes, String filename) {
            super(bytes);
            this.filename = filename;
        }
        @Override public String getFilename() { return filename; }
    }
}
