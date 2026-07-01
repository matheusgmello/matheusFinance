package com.matheusfinance.rebalanceamento;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/rebalanceamento")
@RequiredArgsConstructor
public class RebalanceamentoController {

    private final RebalanceamentoService service;

    @GetMapping("/alvos")
    public List<RebalanceamentoDTO.AlvoResponse> listar(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listarAlvos(perfilId);
    }

    @PostMapping("/alvos")
    public RebalanceamentoDTO.AlvoResponse salvar(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @Valid @RequestBody RebalanceamentoDTO.AlvoRequest body) {
        return service.salvarAlvo(perfilId, body);
    }

    @DeleteMapping("/alvos/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id,
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        service.deletarAlvo(id, perfilId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/calculo")
    public RebalanceamentoDTO.Calculo calcular(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(required = false) BigDecimal aporte) {
        return service.calcular(perfilId, aporte);
    }
}
