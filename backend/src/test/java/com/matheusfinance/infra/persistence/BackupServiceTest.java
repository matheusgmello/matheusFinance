package com.matheusfinance.infra.persistence;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.meta.Meta;
import com.matheusfinance.features.meta.MetaRepository;
import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilBackupDTO;
import com.matheusfinance.features.perfil.PerfilExportImportService;
import com.matheusfinance.features.perfil.PerfilRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BackupService só grava; nada no app até hoje lia o arquivo de volta.
 * Este teste fecha esse ciclo: dispara o backup agendado, lê o JSON gravado
 * em disco com o mesmo tipo de ObjectMapper que a produção usa, e restaura
 * via PerfilExportImportService — provando que o arquivo é de fato utilizável
 * numa recuperação, não só um artefato gravado.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.backup.dir=target/test-backups")
@Transactional
class BackupServiceTest {

    private static final Path BACKUP_DIR = Path.of("target/test-backups");

    @Autowired BackupService backupService;
    @Autowired PerfilExportImportService exportImportService;
    @Autowired PerfilRepository perfilRepository;
    @Autowired CartaoRepository cartaoRepository;
    @Autowired MetaRepository metaRepository;
    @Autowired ObjectMapper objectMapper;

    @AfterEach
    void limparDiretorio() throws IOException {
        if (!Files.exists(BACKUP_DIR)) return;
        try (Stream<Path> arquivos = Files.walk(BACKUP_DIR)) {
            arquivos.sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.delete(p); } catch (IOException ignored) {}
            });
        }
    }

    @Test
    @DisplayName("backup gravado em disco é restaurável")
    void backupEmDiscoRestaura() throws IOException {
        Perfil perfil = perfilRepository.save(Perfil.builder().nome("Backup Teste").build());
        cartaoRepository.save(Cartao.builder()
                .perfil(perfil).nome("Itaú").diaVencimento(15).diaFechamento(5).build());
        metaRepository.save(Meta.builder()
                .perfil(perfil).nome("Viagem").valorAlvo(new BigDecimal("5000.00"))
                .valorAtual(new BigDecimal("1230.55")).prazo(LocalDate.of(2027, 6, 1)).build());

        backupService.executarBackupDiario();

        String hoje = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        Path arquivo = BACKUP_DIR.resolve(hoje).resolve("perfil-" + perfil.getId() + "-backup_teste.json");
        assertThat(arquivo).exists();

        PerfilBackupDTO.Backup lido = objectMapper.readValue(arquivo.toFile(), PerfilBackupDTO.Backup.class);

        Long restauradoId = exportImportService.importar(lido);

        assertThat(cartaoRepository.findAllByPerfilId(restauradoId))
                .singleElement()
                .satisfies(c -> {
                    assertThat(c.getNome()).isEqualTo("Itaú");
                    assertThat(c.getDiaVencimento()).isEqualTo(15);
                    assertThat(c.getDiaFechamento()).isEqualTo(5);
                });

        assertThat(metaRepository.findAllByPerfilIdOrderByCriadoEmAsc(restauradoId))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.getNome()).isEqualTo("Viagem");
                    assertThat(m.getValorAlvo()).isEqualByComparingTo("5000.00");
                    assertThat(m.getValorAtual()).isEqualByComparingTo("1230.55");
                    assertThat(m.getPrazo()).isEqualTo(LocalDate.of(2027, 6, 1));
                });
    }
}
