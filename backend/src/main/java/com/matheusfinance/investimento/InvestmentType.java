package com.matheusfinance.investimento;

public enum InvestmentType {
    STOCK,       // Ação nacional (B3)
    FII,         // Fundo Imobiliário
    TREASURY,    // Tesouro Direto
    BDR,         // Brazilian Depositary Receipt (ex: MSFT34)
    ETF,         // ETF nacional (ex: BOVA11, IVVB11)
    ETF_INT,     // ETF internacional
    STOCK_INT,   // Ação internacional (Stock/REIT)
    RENDA_FIXA   // CDB, LCI, LCA, CRI, CRA, Debenture
}
