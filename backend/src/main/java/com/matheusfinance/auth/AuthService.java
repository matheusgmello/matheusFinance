package com.matheusfinance.auth;

import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilRepository;
import com.matheusfinance.shared.config.JwtUtil;
import com.matheusfinance.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PerfilRepository perfilRepository;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    @Transactional
    public AuthDTO.LoginResponse register(AuthDTO.RegisterRequest req) {
        if (!req.senha().equals(req.confirmarSenha())) {
            throw new IllegalArgumentException("As senhas não coincidem");
        }
        if (usuarioRepository.existsByEmail(req.email().toLowerCase())) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .email(req.email().toLowerCase())
                .senhaHash(passwordEncoder.encode(req.senha()))
                .nome(req.nome().trim())
                .build());

        Perfil perfil = perfilRepository.save(Perfil.builder()
                .nome(req.nome().trim())
                .usuarioId(usuario.getId())
                .build());

        String token = jwtUtil.generateToken(perfil.getId(), usuario.getId());
        return new AuthDTO.LoginResponse(token, perfil.getId(), perfil.getNome());
    }

    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse login(AuthDTO.LoginRequest req) {
        Usuario usuario = usuarioRepository.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("E-mail ou senha incorretos"));

        if (!passwordEncoder.matches(req.senha(), usuario.getSenhaHash())) {
            throw new UnauthorizedException("E-mail ou senha incorretos");
        }

        Perfil perfil = perfilRepository.findFirstByUsuarioId(usuario.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Nenhum perfil encontrado para este usuário"));

        String token = jwtUtil.generateToken(perfil.getId(), usuario.getId());
        return new AuthDTO.LoginResponse(token, perfil.getId(), perfil.getNome());
    }

    @Transactional(readOnly = true)
    public AuthDTO.LoginResponse switchProfile(Long perfilId, Long usuarioId) {
        Perfil perfil = perfilRepository.findAllByUsuarioId(usuarioId).stream()
                .filter(p -> p.getId().equals(perfilId))
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("Perfil não encontrado ou não pertence a este usuário"));

        String token = jwtUtil.generateToken(perfil.getId(), usuarioId);
        return new AuthDTO.LoginResponse(token, perfil.getId(), perfil.getNome());
    }
}
