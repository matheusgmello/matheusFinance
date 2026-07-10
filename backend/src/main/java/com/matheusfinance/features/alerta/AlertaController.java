package com.matheusfinance.features.alerta;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService service;

    @GetMapping("/vencimentos")
    public AlertaDTO.Vencimentos vencimentos(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(defaultValue = "3") int dias
    ) {
        return service.vencimentos(perfilId, dias);
    }
}
