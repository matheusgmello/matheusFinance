package com.matheusfinance.perfil;

import com.matheusfinance.shared.exception.PerfilMismatchException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/perfis")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService service;
    private final PerfilExportImportService exportImportService;
    private final LimparDadosService limparDadosService;

    @GetMapping
    public List<PerfilDTO.Response> listar(HttpServletRequest request) {
        Long usuarioId = (Long) request.getAttribute("jwtUsuarioId");
        return service.listarPorUsuario(usuarioId);
    }

    @GetMapping("/{id}")
    public PerfilDTO.Response buscar(@PathVariable Long id,
                                     @RequestHeader("X-Perfil-Id") Long perfilId) {
        verificarOwnership(id, perfilId);
        return service.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<PerfilDTO.Response> criar(@Valid @RequestBody PerfilDTO.Request body,
                                                     HttpServletRequest request) {
        Long usuarioId = (Long) request.getAttribute("jwtUsuarioId");
        PerfilDTO.Response created = service.criar(body, usuarioId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public PerfilDTO.Response atualizar(@PathVariable Long id,
                                        @RequestHeader("X-Perfil-Id") Long perfilId,
                                        @Valid @RequestBody PerfilDTO.Request body) {
        verificarOwnership(id, perfilId);
        return service.atualizar(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id,
                                        @RequestHeader("X-Perfil-Id") Long perfilId) {
        verificarOwnership(id, perfilId);
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<PerfilBackupDTO.Backup> exportar(@PathVariable Long id,
                                                            @RequestHeader("X-Perfil-Id") Long perfilId) {
        verificarOwnership(id, perfilId);
        PerfilBackupDTO.Backup backup = exportImportService.exportar(id);
        String filename = "perfil-"
                + backup.perfilNome().toLowerCase().replaceAll("\\s+", "-")
                + "-" + LocalDate.now() + ".json";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.APPLICATION_JSON)
                .body(backup);
    }

    @PostMapping("/{id}/limpar")
    public ResponseEntity<Void> limpar(
            @PathVariable Long id,
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestBody PerfilDTO.LimparRequest body) {
        verificarOwnership(id, perfilId);
        limparDadosService.limpar(id, body.confirmar());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import")
    public ResponseEntity<PerfilDTO.Response> importar(@RequestBody PerfilBackupDTO.Backup backup) {
        Long novoId = exportImportService.importar(backup);
        PerfilDTO.Response created = service.buscarPorId(novoId);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .replacePath("/api/perfis/{id}").buildAndExpand(novoId).toUri();
        return ResponseEntity.created(location).body(created);
    }

    private void verificarOwnership(Long id, Long perfilId) {
        if (!id.equals(perfilId)) throw new PerfilMismatchException();
    }
}
