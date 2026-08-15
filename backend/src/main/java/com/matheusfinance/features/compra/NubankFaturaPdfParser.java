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
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Fatura fechada do Nubank em PDF (alternativa ao CSV, útil quando o usuário
 * quer o histórico de um mês que já não está mais "fatura aberta" pra
 * exportar CSV). Formato de linha é bem diferente do CSV — data por extenso
 * abreviada ("28 JUN", sem ano), valor sempre prefixado com "R$", e um
 * marcador de cartão opcional ("•••• 6150") entre a data e o estabelecimento
 * que este parser descarta (o sistema só rastreia o cartão escolhido no
 * upload, não sub-contas por cartão adicional).
 *
 * A tabela "TRANSAÇÕES DE ... A ..." não colide com nenhuma outra linha do
 * documento — diferente do Itaú, aqui basta casar o prefixo de data, sem
 * precisar de marcador de início/fim de seção.
 *
 * Não cobre compra parcelada: a fatura de exemplo usada pra construir este
 * parser não tinha nenhuma parcela ativa naquele mês, então não há como
 * confirmar como o Nubank mostra isso no PDF (o CSV mostra como texto livre
 * no título — "- Parcela 2/3" —, mas o layout do PDF é outra tabela
 * inteiramente diferente, não dá pra assumir que se comporta igual). Também
 * não cobre "próximas faturas": a seção correspondente no PDF só mostra
 * agregados (saldo em aberto), não uma tabela de linhas — não tem o que
 * importar pro mês seguinte, ao contrário do Itaú, que dá o valor detalhado.
 */
@Component
public class NubankFaturaPdfParser {

    private static final Pattern DIA = Pattern.compile("^\\d{2}$");
    private static final Map<String, Integer> MESES = Map.ofEntries(
            Map.entry("JAN", 1), Map.entry("FEV", 2), Map.entry("MAR", 3), Map.entry("ABR", 4),
            Map.entry("MAI", 5), Map.entry("JUN", 6), Map.entry("JUL", 7), Map.entry("AGO", 8),
            Map.entry("SET", 9), Map.entry("OUT", 10), Map.entry("NOV", 11), Map.entry("DEZ", 12));
    private static final Pattern MARCADOR_CARTAO = Pattern.compile("^•+$");
    private static final Pattern ULTIMOS_4_DIGITOS = Pattern.compile("^\\d{4}$");
    private static final Pattern VALOR = Pattern.compile("^\\d{1,3}(\\.\\d{3})*,\\d{2}$");

    public List<LinhaFatura> parse(InputStream input, YearMonth mesReferencia) {
        return parseTexto(FaturaPdfUtil.extrairTexto(input, "Nubank"), mesReferencia);
    }

    /** Separado de parse() pra testar a gramática sem precisar de um PDF de verdade. */
    List<LinhaFatura> parseTexto(String texto, YearMonth mesReferencia) {
        List<LinhaFatura> linhas = new ArrayList<>();
        for (String linhaBruta : texto.split("\n")) {
            LinhaFatura parsed = parseLinha(linhaBruta.trim(), mesReferencia);
            if (parsed != null) linhas.add(parsed);
        }
        return linhas;
    }

    private LinhaFatura parseLinha(String linha, YearMonth mesReferencia) {
        String[] tokens = linha.split("\\s+");
        if (tokens.length < 2 || !DIA.matcher(tokens[0]).matches() || !MESES.containsKey(tokens[1])) {
            return null;
        }

        // Prefixo de data casou — a partir daqui é sinal forte de linha de
        // transação; qualquer falha na estrutura esperada é erro, não ruído.
        if (tokens.length < 5 || !"R$".equals(tokens[tokens.length - 2])
                || !VALOR.matcher(tokens[tokens.length - 1]).matches()) {
            throw new InvalidFileFormatException("Linha de transação malformada no PDF do Nubank: " + linha);
        }

        int inicioDescricao = 2;
        if (tokens.length >= 3 && MARCADOR_CARTAO.matcher(tokens[2]).matches()
                && tokens.length >= 4 && ULTIMOS_4_DIGITOS.matcher(tokens[3]).matches()) {
            inicioDescricao = 4;
        }

        int fimDescricao = tokens.length - 2;
        if (inicioDescricao >= fimDescricao) {
            throw new InvalidFileFormatException("Linha de transação sem estabelecimento no PDF do Nubank: " + linha);
        }

        String descricao = String.join(" ", Arrays.copyOfRange(tokens, inicioDescricao, fimDescricao));
        // Sem exemplo real de virada de ano pra confirmar o comportamento certo.
        LocalDate data = FaturaPdfUtil.resolverData(
                Integer.parseInt(tokens[0]), MESES.get(tokens[1]), mesReferencia);
        BigDecimal valor = new BigDecimal(
                tokens[tokens.length - 1].replace(".", "").replace(",", "."));

        return new LinhaFatura(data, descricao, valor);
    }
}
