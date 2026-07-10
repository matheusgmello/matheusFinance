package com.matheusfinance.features.compra;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/fatura")
@RequiredArgsConstructor
public class FaturaController {

    private final FaturaService faturaService;

    @GetMapping
    public FaturaDTO.Fatura getFatura(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(required = false) Integer ano,
        @RequestParam(required = false) Integer mes
    ) {
        LocalDate now = LocalDate.now();
        return faturaService.getFatura(
            perfilId,
            ano != null ? ano : now.getYear(),
            mes != null ? mes : now.getMonthValue()
        );
    }
}
