package com.matheusfinance.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String CLAIM_PERFIL_ID  = "perfilId";
    private static final String CLAIM_USUARIO_ID = "usuarioId";

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-days:7}")
    private int expirationDays;

    private SecretKey key() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Long perfilId, Long usuarioId) {
        return Jwts.builder()
            .claim(CLAIM_PERFIL_ID,  perfilId)
            .claim(CLAIM_USUARIO_ID, usuarioId)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationDays * 86_400_000L))
            .signWith(key())
            .compact();
    }

    public Long getPerfilId(String token) {
        return getClaims(token).get(CLAIM_PERFIL_ID, Long.class);
    }

    public Long getUsuarioId(String token) {
        return getClaims(token).get(CLAIM_USUARIO_ID, Long.class);
    }

    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(key())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
