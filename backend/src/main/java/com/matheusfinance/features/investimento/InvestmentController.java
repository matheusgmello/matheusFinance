package com.matheusfinance.features.investimento;

import com.matheusfinance.features.patrimonio.PatrimonioDTO;
import com.matheusfinance.features.patrimonio.PatrimonioService;
import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import com.matheusfinance.core.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentImportService service;
    private final PriceUpdateService priceUpdateService;
    private final TreasuryPriceService treasuryPriceService;
    private final FiiMetricaService fiiMetricaService;
    private final InvestmentPositionRepository investmentPositionRepository;
    private final PatrimonioService patrimonioService;
    private final PerfilRepository perfilRepository;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public InvestmentDTO.ImportResult importFile(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate referenceDate,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        InvestmentDTO.ImportResult result = service.importFile(perfilId, referenceDate, file.getBytes());
        // Registra snapshot logo após importar para o histórico começar imediatamente
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
        patrimonioService.tirarSnapshot(perfil, LocalDate.now());
        return result;
    }

    @GetMapping("/summary")
    public InvestmentDTO.SummaryResponse getSummary(
            @RequestHeader("X-Perfil-Id") Long perfilId
    ) {
        return service.getSummary(perfilId);
    }

    @PostMapping("/prices/refresh")
    public Map<String, Integer> refreshPrices(
            @RequestHeader("X-Perfil-Id") Long perfilId
    ) {
        int updated = priceUpdateService.updatePrices(perfilId);
        Perfil perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new ResourceNotFoundException("Perfil não encontrado"));
        patrimonioService.tirarSnapshot(perfil, LocalDate.now());
        return Map.of("updated", updated);
    }

    @PostMapping("/prices/refresh-treasury")
    public Map<String, Integer> refreshTreasuryPrices(
            @RequestHeader("X-Perfil-Id") Long perfilId
    ) {
        List<InvestmentPosition> treasuries =
                investmentPositionRepository.findAllByPerfilIdAndTypeIn(perfilId, List.of(InvestmentType.TREASURY));
        int updated = treasuryPriceService.atualizarPrecos(treasuries);
        return Map.of("updated", updated);
    }

    @GetMapping("/fii-metricas")
    public List<FiiMetricaDTO.Metrica> fiiMetricas(
            @RequestHeader("X-Perfil-Id") Long perfilId) {
        return fiiMetricaService.metricas(perfilId);
    }

    @GetMapping("/historico")
    public PatrimonioDTO.Historico historico(
            @RequestHeader("X-Perfil-Id") Long perfilId,
            @RequestParam(defaultValue = "12") int meses
    ) {
        return patrimonioService.historico(perfilId, meses);
    }
}
