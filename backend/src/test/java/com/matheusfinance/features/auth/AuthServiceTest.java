package com.matheusfinance.features.auth;

import com.matheusfinance.features.perfil.PerfilRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired AuthService authService;
    @Autowired UsuarioRepository usuarioRepository;
    @Autowired PerfilRepository perfilRepository;

    @Test
    @DisplayName("registra com usuário e senha, sem e-mail nem nome separado, e já retorna logado")
    void registraSemEmail() {
        var req = new AuthDTO.RegisterRequest("matheus", "senha123", "senha123");

        AuthDTO.LoginResponse resp = authService.register(req);

        assertThat(resp.token()).isNotBlank();
        assertThat(resp.perfilNome()).isEqualTo("matheus");
        assertThat(usuarioRepository.existsByUsername("matheus")).isTrue();
    }

    @Test
    @DisplayName("usuário é normalizado para minúsculo, mas o nome do perfil preserva a caixa digitada")
    void usernameNormalizadoNomeDoPerfilPreservado() {
        AuthDTO.LoginResponse resp = authService.register(
                new AuthDTO.RegisterRequest("Matheus", "senha123", "senha123"));

        assertThat(usuarioRepository.existsByUsername("matheus")).isTrue();
        assertThat(perfilRepository.findById(resp.perfilId()).orElseThrow().getNome()).isEqualTo("Matheus");
    }

    @Test
    @DisplayName("usuário duplicado é rejeitado, mesmo com caixa diferente")
    void usuarioDuplicadoRejeitado() {
        authService.register(new AuthDTO.RegisterRequest("matheus", "senha123", "senha123"));

        assertThatThrownBy(() -> authService.register(
                new AuthDTO.RegisterRequest("MATHEUS", "outrasenha", "outrasenha")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("senha e confirmação diferentes são rejeitadas antes de tocar o banco")
    void senhasDiferentesRejeitadas() {
        assertThatThrownBy(() -> authService.register(
                new AuthDTO.RegisterRequest("matheus", "senha123", "outraSenha")))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(usuarioRepository.existsByUsername("matheus")).isFalse();
    }

    @Test
    @DisplayName("login com usuário e senha corretos retorna token válido")
    void loginComCredenciaisCorretas() {
        authService.register(new AuthDTO.RegisterRequest("matheus", "senha123", "senha123"));

        AuthDTO.LoginResponse resp = authService.login(new AuthDTO.LoginRequest("matheus", "senha123"));

        assertThat(resp.token()).isNotBlank();
        assertThat(resp.perfilNome()).isEqualTo("matheus");
    }

    @Test
    @DisplayName("login aceita usuário com caixa diferente da cadastrada")
    void loginCaseInsensitive() {
        authService.register(new AuthDTO.RegisterRequest("matheus", "senha123", "senha123"));

        AuthDTO.LoginResponse resp = authService.login(new AuthDTO.LoginRequest("MATHEUS", "senha123"));

        assertThat(resp.token()).isNotBlank();
    }

    @Test
    @DisplayName("senha incorreta é rejeitada")
    void senhaIncorretaRejeitada() {
        authService.register(new AuthDTO.RegisterRequest("matheus", "senha123", "senha123"));

        assertThatThrownBy(() -> authService.login(new AuthDTO.LoginRequest("matheus", "senhaErrada")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("usuário inexistente é rejeitado")
    void usuarioInexistenteRejeitado() {
        assertThatThrownBy(() -> authService.login(new AuthDTO.LoginRequest("naoexiste", "qualquer")))
                .isInstanceOf(UnauthorizedException.class);
    }
}
