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
    private final ItauFaturaPdfParser itauFaturaPdfParser;

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
    public List<FaturaImportDTO.Resultado> importar(
        @RequestParam MultipartFile arquivo,
        @RequestParam Long cartaoId,
        @RequestParam int ano,
        @RequestParam int mes,
        @RequestHeader("X-Perfil-Id") Long perfilId
    ) {
        YearMonth mesAtual = YearMonth.of(ano, mes);
        String nome = arquivo.getOriginalFilename();

        if (nome != null && nome.toLowerCase().endsWith(".pdf")) {
            ItauFaturaPdfParser.Resultado extraido;
            try {
                extraido = itauFaturaPdfParser.parse(arquivo.getInputStream(), mesAtual);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            FaturaImportDTO.Resultado atual =
                    faturaImportService.importar(perfilId, cartaoId, mesAtual, extraido.atual());
            FaturaImportDTO.Resultado proxima =
                    faturaImportService.importar(perfilId, cartaoId, mesAtual.plusMonths(1), extraido.proximaFatura());
            return List.of(atual, proxima);
        }

        List<LinhaFatura> linhas;
        try {
            linhas = nubankFaturaParser.parse(arquivo.getInputStream());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return List.of(faturaImportService.importar(perfilId, cartaoId, mesAtual, linhas));
    }
}
