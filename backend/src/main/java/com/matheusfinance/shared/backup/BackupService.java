package com.matheusfinance.shared.backup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.matheusfinance.perfil.Perfil;
import com.matheusfinance.perfil.PerfilExportImportService;
import com.matheusfinance.perfil.PerfilRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupService {

    private final PerfilRepository perfilRepository;
    private final PerfilExportImportService exportImportService;

    @Value("${app.backup.dir:./backups}")
    private String backupDir;

    @Value("${app.backup.retencao-dias:30}")
    private int retencaoDias;

    @Scheduled(cron = "${app.backup.cron:0 0 3 * * *}")
    public void executarBackupDiario() {
        log.info("Iniciando backup automático");
        List<Perfil> perfis = perfilRepository.findAll();
        String dataStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        Path pasta = Path.of(backupDir, dataStr);

        try {
            Files.createDirectories(pasta);
        } catch (IOException e) {
            log.error("Não foi possível criar diretório de backup: {}", pasta, e);
            return;
        }

        ObjectMapper mapper = new ObjectMapper()
                .enable(SerializationFeature.INDENT_OUTPUT)
                .findAndRegisterModules();

        for (Perfil perfil : perfis) {
            try {
                var backup = exportImportService.exportar(perfil.getId());
                String nomeArquivo = "perfil-" + perfil.getId() + "-" + sanitize(perfil.getNome()) + ".json";
                Path arquivo = pasta.resolve(nomeArquivo);
                mapper.writeValue(arquivo.toFile(), backup);
                log.info("Backup salvo: {}", arquivo);
            } catch (Exception e) {
                log.error("Falha ao fazer backup do perfil {}", perfil.getId(), e);
            }
        }

        limparBackupsAntigos();
        log.info("Backup automático concluído — {} perfil(s)", perfis.size());
    }

    private void limparBackupsAntigos() {
        Path raiz = Path.of(backupDir);
        if (!Files.exists(raiz)) return;
        LocalDate limite = LocalDate.now().minusDays(retencaoDias);

        try (Stream<Path> pastas = Files.list(raiz)) {
            pastas.filter(Files::isDirectory).forEach(pasta -> {
                try {
                    LocalDate data = LocalDate.parse(pasta.getFileName().toString(), DateTimeFormatter.ISO_LOCAL_DATE);
                    if (data.isBefore(limite)) {
                        deletarRecursivo(pasta);
                        log.info("Backup antigo removido: {}", pasta);
                    }
                } catch (Exception ignored) {
                    // diretório com nome não-data, ignorar
                }
            });
        } catch (IOException e) {
            log.warn("Erro ao limpar backups antigos", e);
        }
    }

    private void deletarRecursivo(Path pasta) throws IOException {
        try (Stream<Path> filhos = Files.walk(pasta)) {
            filhos.sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.delete(p); } catch (IOException ignored) {}
            });
        }
    }

    private String sanitize(String nome) {
        return nome.replaceAll("[^a-zA-Z0-9_\\-]", "_").toLowerCase();
    }
}
