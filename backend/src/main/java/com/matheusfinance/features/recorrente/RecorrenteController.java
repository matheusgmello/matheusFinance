package com.matheusfinance.features.recorrente;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/recorrentes")
@RequiredArgsConstructor
public class RecorrenteController {

    private final RecorrenteService service;

    @GetMapping
    public List<RecorrenteDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @PostMapping
    public ResponseEntity<RecorrenteDTO.Response> criar(@Valid @RequestBody RecorrenteDTO.Request body,
                                                        @RequestHeader("X-Perfil-Id") Long perfilId) {
        RecorrenteDTO.Response created = service.criar(body, perfilId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public RecorrenteDTO.Response atualizar(@PathVariable Long id,
                                            @Valid @RequestBody RecorrenteDTO.Request body,
                                            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.atualizar(id, body, perfilId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> inativar(@PathVariable Long id,
                                         @RequestHeader("X-Perfil-Id") Long perfilId) {
        service.inativar(id, perfilId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/checklist")
    public List<RecorrenteDTO.ChecklistResponse> checklist(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam int ano,
        @RequestParam int mes) {
        return service.checklist(perfilId, ano, mes);
    }

    @PatchMapping("/{id}/checklist")
    public RecorrenteDTO.ChecklistResponse marcarPago(
        @PathVariable Long id,
        @RequestParam int ano,
        @RequestParam int mes,
        @RequestBody RecorrenteDTO.MarcarPagoRequest body,
        @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.marcarPago(id, ano, mes, body.pago(), perfilId);
    }
}
