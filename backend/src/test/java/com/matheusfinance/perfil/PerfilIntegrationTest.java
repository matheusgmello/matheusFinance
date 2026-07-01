package com.matheusfinance.perfil;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@DisplayName("Perfil API — Integration Tests")
class PerfilIntegrationTest {

    @LocalServerPort int port;

    RestTemplate rest;
    String baseUrl;

    @BeforeEach
    void setUp() {
        rest = new RestTemplate();
        baseUrl = "http://localhost:" + port;
    }

    @Test
    @DisplayName("POST /api/perfis deve criar perfil e retornar 201")
    void criarPerfil_retorna201() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        var response = rest.postForEntity(
                baseUrl + "/api/perfis",
                new HttpEntity<>(Map.of("nome", "Teste Integration"), headers),
                Map.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("nome")).isEqualTo("Teste Integration");
        assertThat(response.getBody().get("id")).isNotNull();
    }

    @Test
    @DisplayName("GET /api/perfis deve retornar lista")
    void listarPerfis_retornaLista() {
        HttpHeaders headers = new HttpHeaders();
        var response = rest.exchange(
                baseUrl + "/api/perfis",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                List.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(List.class);
    }
}
