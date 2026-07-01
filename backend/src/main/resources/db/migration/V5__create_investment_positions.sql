CREATE TABLE investment_positions (
    id            BIGSERIAL PRIMARY KEY,
    perfil_id     BIGINT        NOT NULL REFERENCES perfis(id),
    ticker        VARCHAR(100)  NOT NULL,
    product_name  VARCHAR(255)  NOT NULL,
    type          VARCHAR(20)   NOT NULL,
    quantity      NUMERIC(18,8) NOT NULL,
    average_price NUMERIC(15,2),
    current_price NUMERIC(15,2),
    total_value   NUMERIC(15,2) NOT NULL,
    institution   VARCHAR(255),
    maturity_date DATE,
    indexer       VARCHAR(50),
    reference_date DATE         NOT NULL,
    imported_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_investment_position UNIQUE (perfil_id, ticker, reference_date)
);

CREATE INDEX idx_investment_positions_perfil ON investment_positions(perfil_id);
