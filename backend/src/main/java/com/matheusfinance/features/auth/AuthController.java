package com.matheusfinance.features.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public AuthDTO.LoginResponse register(@Valid @RequestBody AuthDTO.RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthDTO.LoginResponse login(@Valid @RequestBody AuthDTO.LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/switch-profile")
    public AuthDTO.LoginResponse switchProfile(@RequestParam Long perfilId,
                                               HttpServletRequest request) {
        Long usuarioId = (Long) request.getAttribute("jwtUsuarioId");
        return authService.switchProfile(perfilId, usuarioId);
    }
}
