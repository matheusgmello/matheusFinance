package com.matheusfinance.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/resumo")
    public DashboardDTO.ResumoMes resumo(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(defaultValue = "0") int ano,
        @RequestParam(defaultValue = "0") int mes) {
        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        return service.resumoMes(perfilId, ano, mes);
    }

    @GetMapping("/projecao")
    public List<DashboardDTO.ProjecaoMes> projecao(
        @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.projecao12Meses(perfilId);
    }

    @GetMapping("/consolidado")
    public DashboardDTO.ConsolidadoMes consolidado(
        @RequestParam(defaultValue = "0") int ano,
        @RequestParam(defaultValue = "0") int mes) {
        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        return service.consolidadoMes(ano, mes);
    }
}
