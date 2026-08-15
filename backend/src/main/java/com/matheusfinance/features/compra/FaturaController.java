package com.matheusfinance.features.compra;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/fatura")
@RequiredArgsConstructor
public class FaturaController {

    private final FaturaService faturaService;
    private final FaturaImportService faturaImportService;
    private final NubankFaturaParser nubankFaturaParser;

    @GetMapping
    public FaturaDTO.Fatura getFatura(
        @RequestHeader("X-Perfil-Id") Long perfilId,
        @RequestParam(required = false) Integer ano,
        @RequestParam(required = false) Integer mes
    ) {
        LocalDate now = LocalDate.now();
        return faturaService.getFatura(
            perfilId,
            ano != null ? ano : now.getYear(),
            mes != null ? mes : now.getMonthValue()
        );
    }

    @PostMapping("/importar")
    public FaturaImportDTO.Resultado importar(
        @RequestParam MultipartFile arquivo,
        @RequestParam Long cartaoId,
        @RequestParam int ano,
        @RequestParam int mes,
        @RequestHeader("X-Perfil-Id") Long perfilId
    ) {
        List<LinhaFatura> linhas;
        try {
            linhas = nubankFaturaParser.parse(arquivo.getInputStream());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return faturaImportService.importar(perfilId, cartaoId, YearMonth.of(ano, mes), linhas);
    }
}
