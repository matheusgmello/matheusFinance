package com.matheusfinance.features.compra;

import com.matheusfinance.core.api.exception.InvalidFileFormatException;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Fatura do Itaú: só disponível em PDF. Extração em ordem de stream
 * (sortByPosition=false) — ordenado por posição visual, colunas lado a lado
 * (tabela de lançamentos + caixa de encargos) se misturam numa linha só.
 * Visto com arquivo real: um fragmento de "período (10/08 a 09/09)" vazou
 * pra dentro de uma linha de transação quando ordenado por posição.
 *
 * Cada transação ocupa duas linhas no texto extraído: a primeira com data,
 * estabelecimento, parcela opcional e valor; a segunda com categoria e
 * cidade, que este parser ignora (LinhaFatura não usa esses campos).
 *
 * A fatura tem duas tabelas com a mesma forma de linha — "Lançamentos:
 * compras e saques" (gasto deste mês) e "Compras parceladas - próximas
 * faturas" (prévia do mês seguinte, ainda não fechada, valor comprometido
 * mas não é inferência nossa). Capturadas em listas separadas; cada uma
 * é importada num mês de referência diferente pelo chamador.
 */
@Component
public class ItauFaturaPdfParser {

    private static final Pattern DATA = Pattern.compile("^\\d{2}/\\d{2}$");
    private static final Pattern PARCELA = Pattern.compile("^\\d{1,2}/\\d{2}$");
    private static final Pattern VALOR = Pattern.compile("^\\d{1,3}(\\.\\d{3})*,\\d{2}$");

    public record Resultado(List<LinhaFatura> atual, List<LinhaFatura> proximaFatura) {}

    public Resultado parse(InputStream input, YearMonth mesReferencia) {
        return parseTexto(FaturaPdfUtil.extrairTexto(input, "Itaú"), mesReferencia);
    }

    /** Separado de parse() pra testar a gramática sem precisar de um PDF de verdade. */
    Resultado parseTexto(String texto, YearMonth mesReferencia) {
        List<LinhaFatura> atual = new ArrayList<>();
        List<LinhaFatura> proximaFatura = new ArrayList<>();
        Secao secao = Secao.NENHUMA;

        for (String linhaBruta : texto.split("\n")) {
            String linha = linhaBruta.trim();

            if (linha.contains("Lançamentos: compras e saques")) {
                secao = Secao.ATUAL;
                continue;
            }
            if (linha.contains("Compras parceladas") && linha.contains("próximas faturas")) {
                secao = Secao.PROXIMA;
                continue;
            }
            if (linha.startsWith("Lançamentos no cartão") || linha.startsWith("Próxima fatura")) {
                secao = Secao.NENHUMA;
                continue;
            }
            if (secao == Secao.NENHUMA) continue;

            LinhaFatura parsed = parseLinha(linha, mesReferencia);
            if (parsed == null) continue;

            (secao == Secao.ATUAL ? atual : proximaFatura).add(parsed);
        }

        return new Resultado(atual, proximaFatura);
    }

    private LinhaFatura parseLinha(String linha, YearMonth mesReferencia) {
        String[] tokens = linha.split("\\s+");
        if (tokens.length == 0 || !DATA.matcher(tokens[0]).matches()) return null;

        // A partir daqui, o prefixo de data é sinal forte de que é linha de
        // transação — qualquer falha na estrutura esperada é erro, não ruído.
        if (tokens.length < 3 || !VALOR.matcher(tokens[tokens.length - 1]).matches()) {
            throw new InvalidFileFormatException("Linha de transação malformada no PDF do Itaú: " + linha);
        }

        int fimDescricao = tokens.length - 1;
        boolean temParcela = tokens.length >= 4 && PARCELA.matcher(tokens[tokens.length - 2]).matches();
        if (temParcela) fimDescricao = tokens.length - 2;

        if (fimDescricao <= 1) {
            throw new InvalidFileFormatException("Linha de transação sem estabelecimento no PDF do Itaú: " + linha);
        }

        String descricao = String.join(" ", Arrays.copyOfRange(tokens, 1, fimDescricao));
        if (temParcela) {
            descricao += " - Parcela " + tokens[tokens.length - 2];
        }

        // Não cobre virada de ano com folga de mais de 1 ano (ex: fatura de
        // dezembro com transação de janeiro do ano ainda anterior) — não vi
        // exemplo real desse caso pra confirmar o comportamento certo.
        String[] partesData = tokens[0].split("/");
        LocalDate data = FaturaPdfUtil.resolverData(
                Integer.parseInt(partesData[0]), Integer.parseInt(partesData[1]), mesReferencia);
        BigDecimal valor = new BigDecimal(
                tokens[tokens.length - 1].replace(".", "").replace(",", "."));

        return new LinhaFatura(data, descricao, valor);
    }

    private enum Secao { NENHUMA, ATUAL, PROXIMA }
}
