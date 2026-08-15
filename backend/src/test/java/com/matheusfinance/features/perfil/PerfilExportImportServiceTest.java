package com.matheusfinance.features.perfil;

import com.matheusfinance.features.cartao.Cartao;
import com.matheusfinance.features.cartao.CartaoRepository;
import com.matheusfinance.features.categoria.CategoriaRepository;
import com.matheusfinance.features.compra.CompraParcelada;
import com.matheusfinance.features.compra.CompraRepository;
import com.matheusfinance.features.compra.Parcela;
import com.matheusfinance.features.meta.MetaRepository;
import com.matheusfinance.features.orcamento.OrcamentoRepository;
import com.matheusfinance.features.receita.ReceitaRepository;
import com.matheusfinance.features.recorrente.ChecklistRecorrente;
import com.matheusfinance.features.recorrente.ChecklistRepository;
import com.matheusfinance.features.recorrente.PagamentoRecorrente;
import com.matheusfinance.features.recorrente.RecorrenteRepository;
import com.matheusfinance.features.categoria.Categoria;
import com.matheusfinance.features.meta.Meta;
import com.matheusfinance.features.orcamento.Orcamento;
import com.matheusfinance.features.receita.Receita;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PerfilExportImportServiceTest {

    @Autowired PerfilExportImportService service;
    @Autowired PerfilRepository perfilRepository;
    @Autowired CartaoRepository cartaoRepository;
    @Autowired CompraRepository compraRepository;
    @Autowired RecorrenteRepository recorrenteRepository;
    @Autowired ChecklistRepository checklistRepository;
    @Autowired CategoriaRepository categoriaRepository;
    @Autowired OrcamentoRepository orcamentoRepository;
    @Autowired ReceitaRepository receitaRepository;
    @Autowired MetaRepository metaRepository;

    private Perfil origem;

    @BeforeEach
    void popular() {
        origem = perfilRepository.save(Perfil.builder().nome("Origem").build());

        Cartao cartao = cartaoRepository.save(Cartao.builder()
                .perfil(origem).nome("Nubank").diaVencimento(10).diaFechamento(3).build());

        CompraParcelada compra = CompraParcelada.builder()
                .perfil(origem).cartao(cartao)
                .descricao("Notebook").valorTotal(new BigDecimal("3600.00"))
                .numParcelas(2).dataCompra(LocalDate.of(2026, 1, 15))
                .categoria("Eletrônicos")
                .build();
        compra.getParcelas().add(Parcela.builder()
                .compra(compra).perfil(origem).numero(1).valor(new BigDecimal("1800.00"))
                .dataVencimento(LocalDate.of(2026, 3, 10)).paga(true)
                .pagaEm(OffsetDateTime.parse("2026-03-09T12:00:00Z")).build());
        compra.getParcelas().add(Parcela.builder()
                .compra(compra).perfil(origem).numero(2).valor(new BigDecimal("1800.00"))
                .dataVencimento(LocalDate.of(2026, 4, 10)).paga(false).build());
        compraRepository.save(compra);

        PagamentoRecorrente recorrente = recorrenteRepository.save(PagamentoRecorrente.builder()
                .perfil(origem).empresa("Netflix").valor(new BigDecimal("55.90"))
                .diaVencimento(8).categoria("Assinaturas").ativo(true).build());
        checklistRepository.save(ChecklistRecorrente.builder()
                .recorrente(recorrente).perfil(origem).ano(2026).mes(3)
                .pago(true).pagoEm(OffsetDateTime.parse("2026-03-08T09:00:00Z")).build());

        categoriaRepository.save(Categoria.builder()
                .perfil(origem).nome("Mercado").cor("emerald").build());
        orcamentoRepository.save(Orcamento.builder()
                .perfil(origem).categoria("Mercado").valorLimite(new BigDecimal("1200.00")).build());
        receitaRepository.save(Receita.builder()
                .perfil(origem).ano(2026).mes(3).valor(new BigDecimal("8500.00")).build());
        metaRepository.save(Meta.builder()
                .perfil(origem).nome("Reserva").valorAlvo(new BigDecimal("30000.00"))
                .valorAtual(new BigDecimal("7250.00")).prazo(LocalDate.of(2027, 12, 31)).build());
    }

    @Test
    @DisplayName("round-trip preserva todas as entidades do perfil")
    void roundTripNaoPerdeDado() {
        PerfilBackupDTO.Backup backup = service.exportar(origem.getId());
        Long destinoId = service.importar(backup);

        assertThat(destinoId).isNotEqualTo(origem.getId());
        assertThat(perfilRepository.findById(destinoId)).get()
                .extracting(Perfil::getNome).isEqualTo("Origem");

        assertThat(cartaoRepository.findAllByPerfilId(destinoId))
                .singleElement()
                .satisfies(c -> {
                    assertThat(c.getNome()).isEqualTo("Nubank");
                    assertThat(c.getDiaVencimento()).isEqualTo(10);
                    assertThat(c.getDiaFechamento()).isEqualTo(3);
                });

        assertThat(compraRepository.findAllByPerfilIdWithParcelas(destinoId))
                .singleElement()
                .satisfies(c -> {
                    assertThat(c.getDescricao()).isEqualTo("Notebook");
                    assertThat(c.getValorTotal()).isEqualByComparingTo("3600.00");
                    assertThat(c.getCartao().getNome()).isEqualTo("Nubank");
                    assertThat(c.getParcelas()).hasSize(2);
                    assertThat(c.getParcelas()).anySatisfy(p -> {
                        assertThat(p.getNumero()).isEqualTo(1);
                        assertThat(p.getPaga()).isTrue();
                        assertThat(p.getDataVencimento()).isEqualTo(LocalDate.of(2026, 3, 10));
                    });
                });

        assertThat(recorrenteRepository.findAllByPerfilId(destinoId))
                .singleElement()
                .satisfies(r -> {
                    assertThat(r.getEmpresa()).isEqualTo("Netflix");
                    assertThat(r.getValor()).isEqualByComparingTo("55.90");
                });

        assertThat(checklistRepository.findAllByPerfilId(destinoId))
                .singleElement()
                .satisfies(cl -> {
                    assertThat(cl.getAno()).isEqualTo(2026);
                    assertThat(cl.getMes()).isEqualTo(3);
                    assertThat(cl.getPago()).isTrue();
                });

        assertThat(categoriaRepository.findAllByPerfilIdOrderByNome(destinoId))
                .singleElement()
                .satisfies(c -> {
                    assertThat(c.getNome()).isEqualTo("Mercado");
                    assertThat(c.getCor()).isEqualTo("emerald");
                });

        assertThat(orcamentoRepository.findAllByPerfilId(destinoId))
                .singleElement()
                .satisfies(o -> {
                    assertThat(o.getCategoria()).isEqualTo("Mercado");
                    assertThat(o.getValorLimite()).isEqualByComparingTo("1200.00");
                });

        assertThat(receitaRepository.findAllByPerfilId(destinoId))
                .singleElement()
                .satisfies(r -> {
                    assertThat(r.getAno()).isEqualTo(2026);
                    assertThat(r.getValor()).isEqualByComparingTo("8500.00");
                });

        assertThat(metaRepository.findAllByPerfilIdOrderByCriadoEmAsc(destinoId))
                .singleElement()
                .satisfies(m -> {
                    assertThat(m.getNome()).isEqualTo("Reserva");
                    assertThat(m.getValorAlvo()).isEqualByComparingTo("30000.00");
                    assertThat(m.getValorAtual()).isEqualByComparingTo("7250.00");
                    assertThat(m.getPrazo()).isEqualTo(LocalDate.of(2027, 12, 31));
                });
    }

    @Test
    @DisplayName("backup versão 1 (sem os campos novos) ainda importa")
    void backupAntigoImporta() {
        PerfilBackupDTO.Backup completo = service.exportar(origem.getId());
        PerfilBackupDTO.Backup antigo = new PerfilBackupDTO.Backup(
                "1", completo.exportedAt(), completo.perfilNome(),
                completo.cartoes(), completo.compras(), completo.recorrentes(),
                null, null, null, null);

        Long destinoId = service.importar(antigo);

        assertThat(cartaoRepository.findAllByPerfilId(destinoId)).hasSize(1);
        assertThat(categoriaRepository.findAllByPerfilIdOrderByNome(destinoId)).isEmpty();
        assertThat(metaRepository.findAllByPerfilIdOrderByCriadoEmAsc(destinoId)).isEmpty();
    }
}
