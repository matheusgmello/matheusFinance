package com.matheusfinance.features.compra;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.perfil.Perfil;
import com.matheusfinance.features.perfil.PerfilRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FaturaImportServiceTest {

    @Autowired FaturaImportService importService;
    @Autowired PerfilRepository perfilRepository;
    @Autowired CartaoRepository cartaoRepository;
    @Autowired CompraRepository compraRepository;

    private Perfil perfil;
    private Cartao cartao;

    @BeforeEach
    void setup() {
        perfil = perfilRepository.save(Perfil.builder().nome("Import Teste").build());
        cartao = cartaoRepository.save(Cartao.builder()
                .perfil(perfil).nome("Nubank").diaVencimento(10).diaFechamento(3).build());
    }

    @Test
    @DisplayName("importa linhas e calcula vencimento pelo dia do cartão no mês de referência")
    void importaLinhas() {
        List<LinhaFatura> linhas = List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50")),
                new LinhaFatura(LocalDate.of(2026, 1, 17), "Stok Center", new BigDecimal("49.15")));

        FaturaImportDTO.Resultado resultado =
                importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), linhas);

        assertThat(resultado.linhasImportadas()).isEqualTo(2);
        assertThat(resultado.vencimento()).isEqualTo(LocalDate.of(2026, 2, 10));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).hasSize(2);
        assertThat(compras).allSatisfy(c -> {
            assertThat(c.getNumParcelas()).isEqualTo(1);
            assertThat(c.getFaturaMesReferencia()).isEqualTo(LocalDate.of(2026, 2, 1));
            assertThat(c.getParcelas()).singleElement()
                    .extracting(Parcela::getDataVencimento)
                    .isEqualTo(LocalDate.of(2026, 2, 10));
        });
    }

    @Test
    @DisplayName("reimportar substitui o conteúdo do mesmo mês, sem duplicar")
    void reimportarSubstitui() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50")),
                new LinhaFatura(LocalDate.of(2026, 1, 17), "Stok Center", new BigDecimal("49.15"))));

        FaturaImportDTO.Resultado segundo = importService.importar(
                perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                        new LinhaFatura(LocalDate.of(2026, 1, 20), "Farmácia", new BigDecimal("30.00"))));

        assertThat(segundo.linhasImportadas()).isEqualTo(1);

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).singleElement()
                .extracting(CompraParcelada::getDescricao)
                .isEqualTo("Farmácia");
    }

    @Test
    @DisplayName("reimportar não apaga compra manual no mesmo cartão e mês")
    void naoApagaCompraManual() {
        CompraParcelada manual = CompraParcelada.builder()
                .perfil(perfil).cartao(cartao)
                .descricao("Notebook 3x").valorTotal(new BigDecimal("300.00"))
                .numParcelas(3).dataCompra(LocalDate.of(2026, 1, 15))
                .faturaMesReferencia(null)
                .build();
        manual.getParcelas().add(Parcela.builder()
                .compra(manual).perfil(perfil).numero(1)
                .valor(new BigDecimal("100.00"))
                .dataVencimento(LocalDate.of(2026, 2, 10))
                .paga(false).build());
        compraRepository.save(manual);

        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50"))));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).hasSize(2);
        assertThat(compras).extracting(CompraParcelada::getDescricao)
                .containsExactlyInAnyOrder("Notebook 3x", "Dl*99 Ride");
    }

    @Test
    @DisplayName("compra sem histórico entra sem categoria")
    void semHistoricoNaoCategoriza() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50"))));

        assertThat(compraRepository.findAllByPerfilId(perfil.getId()))
                .singleElement()
                .extracting(CompraParcelada::getCategoria)
                .isNull();
    }

    @Test
    @DisplayName("categoriza automaticamente pelo histórico do mesmo estabelecimento")
    void aprendeCategoriaDoHistorico() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 1), List.of(
                new LinhaFatura(LocalDate.of(2025, 12, 11), "Dl*99 Ride", new BigDecimal("12.50"))));
        CompraParcelada janeiro = compraRepository.findAllByPerfilId(perfil.getId()).get(0);
        janeiro.setCategoria("Transporte");
        compraRepository.save(janeiro);

        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 15), "Dl*99 Ride", new BigDecimal("15.00"))));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).filteredOn(c -> c.getDataCompra().equals(LocalDate.of(2026, 1, 15)))
                .singleElement()
                .extracting(CompraParcelada::getCategoria)
                .isEqualTo("Transporte");
    }

    @Test
    @DisplayName("sufixo de parcela não impede o aprendizado do mesmo estabelecimento")
    void aprendeIgnorandoSufixoDeParcela() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 1), List.of(
                new LinhaFatura(LocalDate.of(2025, 12, 24), "AMAZON BRSAO P - Parcela 01/02", new BigDecimal("62.10"))));
        CompraParcelada parcela1 = compraRepository.findAllByPerfilId(perfil.getId()).get(0);
        parcela1.setCategoria("Compras");
        compraRepository.save(parcela1);

        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2025, 12, 24), "AMAZON BRSAO P - Parcela 02/02", new BigDecimal("62.09"))));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).filteredOn(c -> c.getDescricao().endsWith("02/02"))
                .singleElement()
                .extracting(CompraParcelada::getCategoria)
                .isEqualTo("Compras");
    }

    @Test
    @DisplayName("categoria mais recente do estabelecimento vence quando há mais de uma")
    void categoriaMaisRecenteVence() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2025, 12), List.of(
                new LinhaFatura(LocalDate.of(2025, 11, 5), "Dl*99 Ride", new BigDecimal("10.00"))));
        CompraParcelada antiga = compraRepository.findAllByPerfilId(perfil.getId()).get(0);
        antiga.setCategoria("Transporte");
        compraRepository.save(antiga);

        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 1), List.of(
                new LinhaFatura(LocalDate.of(2025, 12, 20), "Dl*99 Ride", new BigDecimal("11.00"))));
        CompraParcelada recente = compraRepository.findAllByPerfilId(perfil.getId()).stream()
                .filter(c -> c.getDataCompra().equals(LocalDate.of(2025, 12, 20)))
                .findFirst().orElseThrow();
        recente.setCategoria("Lazer");
        compraRepository.save(recente);

        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 15), "Dl*99 Ride", new BigDecimal("12.00"))));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).filteredOn(c -> c.getDataCompra().equals(LocalDate.of(2026, 1, 15)))
                .singleElement()
                .extracting(CompraParcelada::getCategoria)
                .isEqualTo("Lazer");
    }

    @Test
    @DisplayName("reimportar o mesmo mês não perde a categoria que já tinha sido dada nele")
    void reimportarMesmoMesPreservaCategoriaJaDada() {
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50"))));
        CompraParcelada compra = compraRepository.findAllByPerfilId(perfil.getId()).get(0);
        compra.setCategoria("Transporte");
        compraRepository.save(compra);

        // reimporta o MESMO mês, com uma linha extra (ex: banco corrigiu algo na fatura)
        importService.importar(perfil.getId(), cartao.getId(), YearMonth.of(2026, 2), List.of(
                new LinhaFatura(LocalDate.of(2026, 1, 11), "Dl*99 Ride", new BigDecimal("12.50")),
                new LinhaFatura(LocalDate.of(2026, 1, 12), "Padaria", new BigDecimal("8.00"))));

        List<CompraParcelada> compras = compraRepository.findAllByPerfilId(perfil.getId());
        assertThat(compras).filteredOn(c -> c.getDescricao().equals("Dl*99 Ride"))
                .singleElement()
                .extracting(CompraParcelada::getCategoria)
                .isEqualTo("Transporte");
    }

    @Test
    @DisplayName("dia de vencimento maior que o mês é ajustado (ex: dia 31 em fevereiro)")
    void ajustaDiaDeVencimentoEmMesCurto() {
        Cartao cartaoDia31 = cartaoRepository.save(Cartao.builder()
                .perfil(perfil).nome("Itaú").diaVencimento(31).diaFechamento(20).build());

        FaturaImportDTO.Resultado resultado = importService.importar(
                perfil.getId(), cartaoDia31.getId(), YearMonth.of(2026, 2), List.of(
                        new LinhaFatura(LocalDate.of(2026, 1, 25), "Compra", new BigDecimal("50.00"))));

        assertThat(resultado.vencimento()).isEqualTo(LocalDate.of(2026, 2, 28));
    }
}
