package com.matheusfinance.features.orcamento;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
@RequiredArgsConstructor
public class OrcamentoController {

    private final OrcamentoService service;

    @GetMapping
    public List<OrcamentoDTO.Response> listar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(defaultValue = "0") int ano,
        @RequestParam(defaultValue = "0") int mes
    ) {
        if (ano == 0) ano = LocalDate.now().getYear();
        if (mes == 0) mes = LocalDate.now().getMonthValue();
        return service.listar(perfilId, ano, mes);
    }

    @PostMapping
    public ResponseEntity<OrcamentoDTO.Response> criar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @Valid @RequestBody OrcamentoDTO.Request req
    ) {
        return ResponseEntity.status(201).body(service.criar(perfilId, req));
    }

    @PutMapping("/{id}")
    public OrcamentoDTO.Response atualizar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @PathVariable Long id,
        @Valid @RequestBody OrcamentoDTO.Request req
    ) {
        return service.atualizar(perfilId, id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @PathVariable Long id
    ) {
        service.deletar(perfilId, id);
        return ResponseEntity.noContent().build();
    }
}
