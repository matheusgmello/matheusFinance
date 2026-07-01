package com.matheusfinance.compra;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/compras")
@RequiredArgsConstructor
public class CompraController {

    private final CompraService service;

    @GetMapping
    public List<CompraDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @GetMapping("/{id}")
    public CompraDTO.Response buscar(@PathVariable Long id,
                                     @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.buscar(id, perfilId);
    }

    @PostMapping
    public ResponseEntity<CompraDTO.Response> criar(@Valid @RequestBody CompraDTO.Request body,
                                                    @RequestHeader("X-Perfil-Id") Long perfilId) {
        CompraDTO.Response created = service.criar(body, perfilId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public CompraDTO.Response atualizar(@PathVariable Long id,
                                        @Valid @RequestBody CompraDTO.Request body,
                                        @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.atualizar(id, body, perfilId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id,
                                        @RequestHeader("X-Perfil-Id") Long perfilId) {
        service.deletar(id, perfilId);
        return ResponseEntity.noContent().build();
    }
}
