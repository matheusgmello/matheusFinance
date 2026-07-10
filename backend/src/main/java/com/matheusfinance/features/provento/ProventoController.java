package com.matheusfinance.features.provento;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/proventos")
@RequiredArgsConstructor
public class ProventoController {

    private final ProventoService service;
    private final ProventoImportService importService;

    @PostMapping
    public ResponseEntity<ProventoDTO.Response> criar(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @Valid @RequestBody ProventoDTO.Request body) {
        ProventoDTO.Response created = service.criar(perfilId, body);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @GetMapping
    public List<ProventoDTO.Response> listar(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(required = false) String ticker) {
        return service.listar(perfilId, ticker);
    }

    @GetMapping("/resumo")
    public ProventoDTO.ResumoGeral resumo(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.resumo(perfilId);
    }

    @GetMapping("/projecao")
    public ProventoDTO.ProjecaoRenda projecao(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.projecaoRenda(perfilId);
    }

    @GetMapping("/calendario")
    public List<ProventoDTO.CalendarioMes> calendario(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "3") int meses) {
        return service.calendario(perfilId, meses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id,
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        service.deletar(id, perfilId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProventoDTO.ImportResult importarCsv(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam("file") MultipartFile file) throws Exception {
        return importService.importCsv(perfilId, file.getBytes());
    }
}
