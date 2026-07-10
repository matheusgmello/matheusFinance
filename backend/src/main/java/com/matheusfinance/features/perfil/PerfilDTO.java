package com.matheusfinance.features.perfil;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class PerfilDTO {

    public record Request(
        @NotBlank @Size(min = 2, max = 100) String nome
    ) {}

    public record Response(
        Long id,
        String nome,
        OffsetDateTime criadoEm
    ) {}

    public record LimparRequest(
        @NotBlank String confirmar  // deve ser "CONFIRMAR" para evitar cliques acidentais
    ) {}
}
