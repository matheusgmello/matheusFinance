package com.matheusfinance.features.patrimonio;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/patrimonio")
@RequiredArgsConstructor
public class PatrimonioController {

    private final PatrimonioService service;

    @GetMapping("/historico")
    public PatrimonioDTO.Historico historico(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "12") int meses) {
        return service.historico(perfilId, meses);
    }

    @PostMapping("/snapshot")
    public void snapshot(@RequestHeader("X-Perfil-Id") Long perfilId) {
        service.tirarSnapshotAgora(perfilId);
    }
}
