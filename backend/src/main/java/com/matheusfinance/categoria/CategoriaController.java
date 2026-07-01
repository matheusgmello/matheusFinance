package com.matheusfinance.categoria;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService service;

    @GetMapping
    public List<CategoriaDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @PostMapping
    public ResponseEntity<CategoriaDTO.Response> criar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @Valid @RequestBody CategoriaDTO.Request req
    ) {
        return ResponseEntity.status(201).body(service.criar(perfilId, req));
    }

    @PutMapping("/{id}")
    public CategoriaDTO.Response atualizar(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @PathVariable Long id,
        @Valid @RequestBody CategoriaDTO.Request req
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
