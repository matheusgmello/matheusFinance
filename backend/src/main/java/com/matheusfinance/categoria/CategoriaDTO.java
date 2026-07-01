package com.matheusfinance.categoria;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CategoriaDTO {

    public record Request(
        @NotBlank String nome,
        @NotBlank @Pattern(regexp = "slate|red|orange|amber|emerald|teal|blue|violet|pink|rose") String cor
    ) {}

    public record Response(Long id, String nome, String cor) {}
}
