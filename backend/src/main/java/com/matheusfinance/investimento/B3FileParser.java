package com.matheusfinance.investimento;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;

public interface B3FileParser {

    boolean supportsHeaders(Set<String> headers);

    List<InvestmentDTO.ParsedPosition> parse(InputStream input) throws IOException;
}
