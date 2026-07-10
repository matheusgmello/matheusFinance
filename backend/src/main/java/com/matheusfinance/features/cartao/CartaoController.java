package com.matheusfinance.features.cartao;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/cartoes")
@RequiredArgsConstructor
public class CartaoController {

    private final CartaoService service;

    @GetMapping
    public List<CartaoDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @GetMapping("/{id}")
    public CartaoDTO.Response buscar(@PathVariable Long id,
                                     @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.buscar(id, perfilId);
    }

    @PostMapping
    public ResponseEntity<CartaoDTO.Response> criar(@Valid @RequestBody CartaoDTO.Request body,
                                                    @RequestHeader("X-Perfil-Id") Long perfilId) {
        CartaoDTO.Response created = service.criar(body, perfilId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public CartaoDTO.Response atualizar(@PathVariable Long id,
                                        @Valid @RequestBody CartaoDTO.Request body,
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
