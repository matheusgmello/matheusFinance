package com.matheusfinance.perfil;

import com.matheusfinance.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PerfilService — Unit Tests")
class PerfilServiceTest {

    @Mock
    PerfilRepository repository;

    @InjectMocks
    PerfilService service;

    Perfil perfilExistente;

    @BeforeEach
    void setUp() {
        perfilExistente = Perfil.builder()
            .id(1L)
            .nome("Matheus")
            .criadoEm(OffsetDateTime.now())
            .build();
    }

    @Test
    @DisplayName("listarTodos deve retornar lista de perfis")
    void listarTodos_deveRetornarLista() {
        given(repository.findAll()).willReturn(List.of(perfilExistente));

        List<PerfilDTO.Response> result = service.listarTodos();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nome()).isEqualTo("Matheus");
    }

    @Test
    @DisplayName("buscarPorId deve retornar perfil quando encontrado")
    void buscarPorId_deveRetornarPerfil() {
        given(repository.findById(1L)).willReturn(Optional.of(perfilExistente));

        PerfilDTO.Response result = service.buscarPorId(1L);

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.nome()).isEqualTo("Matheus");
    }

    @Test
    @DisplayName("buscarPorId deve lançar ResourceNotFoundException quando não encontrado")
    void buscarPorId_deveLancarExcecaoQuandoNaoEncontrado() {
        given(repository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscarPorId(99L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("99");
    }

    @Test
    @DisplayName("criar deve persistir e retornar novo perfil")
    void criar_devePersistirPerfil() {
        PerfilDTO.Request request = new PerfilDTO.Request("Novo Perfil");
        Perfil saved = Perfil.builder().id(2L).nome("Novo Perfil").criadoEm(OffsetDateTime.now()).build();
        given(repository.save(any())).willReturn(saved);

        PerfilDTO.Response result = service.criar(request);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.nome()).isEqualTo("Novo Perfil");
        then(repository).should().save(any(Perfil.class));
    }

    @Test
    @DisplayName("atualizar deve modificar o nome do perfil")
    void atualizar_deveModificarNome() {
        given(repository.findById(1L)).willReturn(Optional.of(perfilExistente));
        given(repository.save(any())).willAnswer(inv -> inv.getArgument(0));

        PerfilDTO.Response result = service.atualizar(1L, new PerfilDTO.Request("Novo Nome"));

        assertThat(result.nome()).isEqualTo("Novo Nome");
    }

    @Test
    @DisplayName("atualizar deve lançar exceção quando perfil não existe")
    void atualizar_deveLancarExcecaoQuandoNaoEncontrado() {
        given(repository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> service.atualizar(99L, new PerfilDTO.Request("X")))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deletar deve chamar deleteById quando perfil existe")
    void deletar_deveRemoverPerfil() {
        given(repository.findById(1L)).willReturn(Optional.of(perfilExistente));
        willDoNothing().given(repository).deleteById(1L);

        service.deletar(1L);

        then(repository).should().deleteById(1L);
    }

    @Test
    @DisplayName("deletar deve lançar exceção quando perfil não existe")
    void deletar_deveLancarExcecaoQuandoNaoEncontrado() {
        given(repository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> service.deletar(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
