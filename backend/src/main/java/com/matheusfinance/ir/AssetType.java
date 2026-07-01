package com.matheusfinance.ir;

public enum AssetType {
    STOCK,      // Ação nacional — swing 15% (isenção ≤20k), day trade 20%
    FII,        // FII — 20% sem isenção
    TREASURY,   // Tesouro Direto — tabela regressiva
    BDR,        // BDR — 15% swing (sem isenção), 20% day trade
    ETF,        // ETF nacional — 15% (sem isenção de 20k)
    ETF_INT,    // ETF internacional — 15%
    STOCK_INT   // Stock/REIT internacional — 15%
}
