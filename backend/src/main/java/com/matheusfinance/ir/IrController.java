package com.matheusfinance.ir;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ir")
@RequiredArgsConstructor
public class IrController {

    private final IrService service;
    private final IrImportService importService;
    private final DarfPdfService darfPdfService;
    private final IrDeclaracaoService declaracaoService;

    @GetMapping("/operacoes")
    public List<IrDTO.OperacaoResponse> listar(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.listar(perfilId);
    }

    @PostMapping("/operacoes")
    public IrDTO.OperacaoResponse criar(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @Valid @RequestBody IrDTO.OperacaoRequest body) {
        return service.criar(perfilId, body);
    }

    @DeleteMapping("/operacoes/{id}")
    public ResponseEntity<Void> deletar(
            @PathVariable Long id,
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        service.deletar(id, perfilId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/apuracao")
    public IrDTO.Apuracao apurar(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(required = false) Integer ano) {
        return service.apurar(perfilId, ano);
    }

    @GetMapping("/posicoes")
    public List<IrDTO.PosicaoAtual> posicoes(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.posicoes(perfilId);
    }

    @GetMapping("/isentometro")
    public IrDTO.Isentometro isentometro(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return service.isentometro(perfilId);
    }

    @PostMapping("/operacoes/import")
    public IrImportService.ImportResult importCsv(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam("file") MultipartFile file) throws Exception {
        return importService.importCsv(perfilId, file.getBytes());
    }

    @GetMapping("/declaracao/pdf")
    public ResponseEntity<byte[]> declaracaoPdf(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "0") int ano) {
        int anoFinal = ano > 0 ? ano : java.time.LocalDate.now().getYear() - 1;
        byte[] pdf = declaracaoService.gerarRelatorio(perfilId, anoFinal);
        String filename = "Declaracao_IRPF_" + anoFinal + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }

    @GetMapping("/darf/pdf")
    public ResponseEntity<byte[]> darfPdf(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam String mes,
            @RequestParam IrDTO.Categoria categoria) {
        byte[] pdf = darfPdfService.gerarDarf(perfilId, mes, categoria);
        String filename = "DARF_" + mes + "_" + categoria + ".pdf";
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(pdf);
    }
}
