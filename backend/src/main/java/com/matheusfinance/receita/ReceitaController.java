package com.matheusfinance.receita;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/receitas")
@RequiredArgsConstructor
public class ReceitaController {

    private final ReceitaService service;

    @GetMapping
    public ReceitaDTO.Response buscar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(defaultValue = "0") int ano,
        @RequestParam(defaultValue = "0") int mes
    ) {
        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        return service.buscar(perfilId, ano, mes);
    }

    @PutMapping
    public ReceitaDTO.Response salvar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(defaultValue = "0") int ano,
        @RequestParam(defaultValue = "0") int mes,
        @Valid @RequestBody ReceitaDTO.Request req
    ) {
        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        return service.salvar(perfilId, ano, mes, req);
    }
}
