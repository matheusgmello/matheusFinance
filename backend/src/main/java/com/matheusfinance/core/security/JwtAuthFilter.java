package com.matheusfinance.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain chain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.isValid(token)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token inválido ou expirado");
            return;
        }

        String path = request.getRequestURI();

        Long perfilId  = jwtUtil.getPerfilId(token);
        Long usuarioId = jwtUtil.getUsuarioId(token);

        // Expõe ids como atributos para os controllers usarem
        request.setAttribute("jwtPerfilId",  perfilId);
        request.setAttribute("jwtUsuarioId", usuarioId);

        // Para endpoints fora de /api/auth, valida que X-Perfil-Id bate com o token
        // (exceto rotas de coleção de perfis que usam usuarioId)
        if (!path.startsWith("/api/auth/") && !isPerfilCollectionPath(path)) {
            String headerPerfilId = request.getHeader("X-Perfil-Id");
            if (headerPerfilId == null || !headerPerfilId.equals(String.valueOf(perfilId))) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "X-Perfil-Id não bate com o token");
                return;
            }
        }

        var auth = new UsernamePasswordAuthenticationToken(
                String.valueOf(perfilId), null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
    }

    /** Rotas de coleção de perfis que usam usuarioId (não precisam de X-Perfil-Id) */
    private boolean isPerfilCollectionPath(String path) {
        return path.equals("/api/perfis")
            || path.equals("/api/perfis/")
            || path.equals("/api/perfis/import");
    }
}
