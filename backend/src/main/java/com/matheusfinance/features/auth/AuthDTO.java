package com.matheusfinance.features.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTO {

    public record LoginResponse(
        String token,
        Long perfilId,
        String perfilNome
    ) {}

    public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50) String usuario,
        @NotBlank @Size(min = 6, max = 100) String senha,
        @NotBlank String confirmarSenha
    ) {}

    public record LoginRequest(
        @NotBlank String usuario,
        @NotBlank String senha
    ) {}
}
