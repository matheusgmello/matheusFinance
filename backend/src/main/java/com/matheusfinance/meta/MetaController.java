package com.matheusfinance.meta;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/metas")
@RequiredArgsConstructor
public class MetaController {

    private final MetaService service;

    @GetMapping
    public List<MetaDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MetaDTO.Response criar(@RequestHeader("X-Perfil-Id") Long perfilId,
                                  @Valid @RequestBody MetaDTO.Request req) {
        return service.criar(perfilId, req);
    }

    @PostMapping("/{id}/aportes")
    public MetaDTO.Response aportar(@RequestHeader("X-Perfil-Id") Long perfilId,
                                    @PathVariable Long id,
                                    @Valid @RequestBody MetaDTO.AporteRequest req) {
        return service.aportar(perfilId, id, req);
    }

    @PutMapping("/{id}")
    public MetaDTO.Response atualizar(@RequestHeader("X-Perfil-Id") Long perfilId,
                                      @PathVariable Long id,
                                      @Valid @RequestBody MetaDTO.Request req) {
        return service.atualizar(perfilId, id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@RequestHeader("X-Perfil-Id") Long perfilId,
                        @PathVariable Long id) {
        service.deletar(perfilId, id);
    }
}
