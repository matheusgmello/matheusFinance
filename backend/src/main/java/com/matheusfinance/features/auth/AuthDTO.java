package com.matheusfinance.features.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDTO {

    public record LoginResponse(
        String token,
        Long perfilId,
        String perfilNome
    ) {}

    public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 1, max = 100) String nome,
        @NotBlank @Size(min = 6, max = 100) String senha,
        @NotBlank String confirmarSenha
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String senha
    ) {}
}
