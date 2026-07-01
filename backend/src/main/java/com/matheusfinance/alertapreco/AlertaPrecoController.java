package com.matheusfinance.alertapreco;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alertas-preco")
@RequiredArgsConstructor
public class AlertaPrecoController {

    private final AlertaPrecoService service;

    @GetMapping
    public List<AlertaPrecoDTO.Response> listar(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @GetMapping("/disparados")
    public List<AlertaPrecoDTO.Response> disparados(@RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.disparados(perfilId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlertaPrecoDTO.Response criar(@RequestHeader("X-Perfil-Id") Long perfilId,
                                         @Valid @RequestBody AlertaPrecoDTO.Request req) {
        return service.criar(perfilId, req);
    }

    @PostMapping("/{id}/dispensar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void dispensar(@RequestHeader("X-Perfil-Id") Long perfilId, @PathVariable Long id) {
        service.dispensar(perfilId, id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@RequestHeader("X-Perfil-Id") Long perfilId, @PathVariable Long id) {
        service.deletar(perfilId, id);
    }
}
