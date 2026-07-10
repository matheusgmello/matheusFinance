package com.matheusfinance.features.benchmark;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/benchmarks")
@RequiredArgsConstructor
public class BenchmarkController {

    private final BenchmarkService service;

    @GetMapping("/historico")
    public BenchmarkDTO.Historico historico(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "12") int meses) {
        return service.historico(perfilId, meses);
    }
}
