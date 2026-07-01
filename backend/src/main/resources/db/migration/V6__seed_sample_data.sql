-- =============================================================================
-- V6 — Dados de exemplo: perfil "Matheus" com cartões, compras e recorrentes
-- Idempotente: não executa se o perfil já existir.
-- =============================================================================

DO $$
DECLARE
    v_pid   BIGINT;  -- perfil_id
    v_nub   BIGINT;  -- cartão Nubank  (fech=3,  venc=10)
    v_int   BIGINT;  -- cartão Inter   (fech=8,  venc=15)
    v_cid   BIGINT;  -- compra_id / recorrente_id (reutilizado)
    i       INT;
    v_val   NUMERIC(15,2);
    v_date  DATE;
BEGIN
    -- Só executa se o perfil ainda não existir
    IF EXISTS (SELECT 1 FROM perfis WHERE nome = 'Matheus') THEN
        RAISE NOTICE 'Perfil Matheus já existe — seed ignorado.';
        RETURN;
    END IF;

    -- ── Perfil ────────────────────────────────────────────────────────────────
    INSERT INTO perfis (nome) VALUES ('Matheus') RETURNING id INTO v_pid;

    -- ── Cartões ───────────────────────────────────────────────────────────────
    INSERT INTO cartoes (perfil_id, nome, dia_vencimento, dia_fechamento)
    VALUES (v_pid, 'Nubank', 10, 3) RETURNING id INTO v_nub;

    INSERT INTO cartoes (perfil_id, nome, dia_vencimento, dia_fechamento)
    VALUES (v_pid, 'Inter', 15, 8) RETURNING id INTO v_int;

    -- ── Compra 1: Notebook Dell — 18x R$400 no Nubank ────────────────────────
    -- data_compra=2025-08-05 | dia_compra(5) >= dia_fech(3)
    -- → 1ª parcela: 2025-10-10
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_nub, 'Notebook Dell Inspiron 15', 7200.00, 18, '2025-08-05', 'Eletrônicos')
    RETURNING id INTO v_cid;

    v_val := 400.00;
    FOR i IN 1..18 LOOP
        v_date := ('2025-10-10'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga, paga_em)
        VALUES (
            v_cid, v_pid, i, v_val, v_date,
            v_date <= '2026-04-23',
            CASE WHEN v_date <= '2026-04-23'
                 THEN (v_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
                 ELSE NULL END
        );
    END LOOP;

    -- ── Compra 2: iPhone 15 — 12x R$450 no Nubank ────────────────────────────
    -- data_compra=2025-10-15 | dia_compra(15) >= dia_fech(3)
    -- → 1ª parcela: 2025-12-10
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_nub, 'iPhone 15 128GB', 5400.00, 12, '2025-10-15', 'Eletrônicos')
    RETURNING id INTO v_cid;

    v_val := 450.00;
    FOR i IN 1..12 LOOP
        v_date := ('2025-12-10'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga, paga_em)
        VALUES (
            v_cid, v_pid, i, v_val, v_date,
            v_date <= '2026-04-23',
            CASE WHEN v_date <= '2026-04-23'
                 THEN (v_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
                 ELSE NULL END
        );
    END LOOP;

    -- ── Compra 3: Smart TV 55" — 6x R$600 no Inter ───────────────────────────
    -- data_compra=2026-01-20 | dia_compra(20) >= dia_fech(8)
    -- → 1ª parcela: 2026-03-15
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_int, 'Smart TV Samsung 55" 4K', 3600.00, 6, '2026-01-20', 'Eletrônicos')
    RETURNING id INTO v_cid;

    v_val := 600.00;
    FOR i IN 1..6 LOOP
        v_date := ('2026-03-15'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga, paga_em)
        VALUES (
            v_cid, v_pid, i, v_val, v_date,
            v_date <= '2026-04-23',
            CASE WHEN v_date <= '2026-04-23'
                 THEN (v_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
                 ELSE NULL END
        );
    END LOOP;

    -- ── Compra 4: Cadeira Gamer — 6x R$300 no Inter ──────────────────────────
    -- data_compra=2026-02-10 | dia_compra(10) >= dia_fech(8)
    -- → 1ª parcela: 2026-04-15
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_int, 'Cadeira Gamer ThunderX3 EC3', 1800.00, 6, '2026-02-10', 'Móveis')
    RETURNING id INTO v_cid;

    v_val := 300.00;
    FOR i IN 1..6 LOOP
        v_date := ('2026-04-15'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga, paga_em)
        VALUES (
            v_cid, v_pid, i, v_val, v_date,
            v_date <= '2026-04-23',
            CASE WHEN v_date <= '2026-04-23'
                 THEN (v_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
                 ELSE NULL END
        );
    END LOOP;

    -- ── Compra 5: Airfryer — 3x R$200 no Nubank (futuro) ─────────────────────
    -- data_compra=2026-03-25 | dia_compra(25) >= dia_fech(3)
    -- → 1ª parcela: 2026-05-10
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_nub, 'Airfryer Philips Walita', 600.00, 3, '2026-03-25', 'Eletrodomésticos')
    RETURNING id INTO v_cid;

    v_val := 200.00;
    FOR i IN 1..3 LOOP
        v_date := ('2026-05-10'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga)
        VALUES (v_cid, v_pid, i, v_val, v_date, FALSE);
    END LOOP;

    -- ── Compra 6: Monitor 27" — 10x R$320 no Nubank ──────────────────────────
    -- data_compra=2025-12-02 | dia_compra(2) < dia_fech(3)
    -- → 1ª parcela: 2026-01-10
    INSERT INTO compras_parceladas
        (perfil_id, cartao_id, descricao, valor_total, num_parcelas, data_compra, categoria)
    VALUES (v_pid, v_nub, 'Monitor LG 27" IPS 144Hz', 3200.00, 10, '2025-12-02', 'Eletrônicos')
    RETURNING id INTO v_cid;

    v_val := 320.00;
    FOR i IN 1..10 LOOP
        v_date := ('2026-01-10'::DATE + ((i - 1) * INTERVAL '1 month'))::DATE;
        INSERT INTO parcelas (compra_id, perfil_id, numero, valor, data_vencimento, paga, paga_em)
        VALUES (
            v_cid, v_pid, i, v_val, v_date,
            v_date <= '2026-04-23',
            CASE WHEN v_date <= '2026-04-23'
                 THEN (v_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE
                 ELSE NULL END
        );
    END LOOP;

    -- ── Recorrentes ───────────────────────────────────────────────────────────
    -- Helper: insere 6 meses de histórico (Nov/25–Abr/26) para cada recorrente
    -- Os meses passados são marcados como pago=true, o atual como false (exceto
    -- quando dia_vencimento já passou no mês corrente).

    -- Netflix — R$55,90, dia 5
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'Netflix', 55.90, 5, 'Entretenimento') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-06 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-06 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-06 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-06 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-06 10:00:00+00'),
        -- Abril: dia 5 já passou (hoje=23) → pago
        (v_cid, v_pid, 2026,  4, TRUE,  '2026-04-06 10:00:00+00');

    -- Spotify — R$21,90, dia 15
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'Spotify', 21.90, 15, 'Entretenimento') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-16 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-16 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-16 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-16 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-16 10:00:00+00'),
        -- Abril: dia 15 já passou → pago
        (v_cid, v_pid, 2026,  4, TRUE,  '2026-04-16 10:00:00+00');

    -- Smart Fit — R$120,00, dia 10
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'Smart Fit', 120.00, 10, 'Saúde') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-11 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-11 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-11 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-11 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-11 10:00:00+00'),
        -- Abril: dia 10 já passou → pago
        (v_cid, v_pid, 2026,  4, TRUE,  '2026-04-11 10:00:00+00');

    -- Vivo Fibra — R$99,90, dia 20
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'Vivo Fibra', 99.90, 20, 'Moradia') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-21 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-21 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-21 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-21 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-21 10:00:00+00'),
        -- Abril: dia 20 já passou → pago
        (v_cid, v_pid, 2026,  4, TRUE,  '2026-04-21 10:00:00+00');

    -- Unimed — R$350,00, dia 8
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'Unimed', 350.00, 8, 'Saúde') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-09 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-09 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-09 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-09 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-09 10:00:00+00'),
        -- Abril: dia 8 já passou → pago
        (v_cid, v_pid, 2026,  4, TRUE,  '2026-04-09 10:00:00+00');

    -- iFood Pass — R$29,90, dia 25 (ainda não venceu em Abril)
    INSERT INTO pagamentos_recorrentes (perfil_id, empresa, valor, dia_vencimento, categoria)
    VALUES (v_pid, 'iFood Pass', 29.90, 25, 'Alimentação') RETURNING id INTO v_cid;
    INSERT INTO checklist_recorrentes (recorrente_id, perfil_id, ano, mes, pago, pago_em) VALUES
        (v_cid, v_pid, 2025, 11, TRUE,  '2025-11-26 10:00:00+00'),
        (v_cid, v_pid, 2025, 12, TRUE,  '2025-12-26 10:00:00+00'),
        (v_cid, v_pid, 2026,  1, TRUE,  '2026-01-26 10:00:00+00'),
        (v_cid, v_pid, 2026,  2, TRUE,  '2026-02-26 10:00:00+00'),
        (v_cid, v_pid, 2026,  3, TRUE,  '2026-03-26 10:00:00+00'),
        -- Abril: dia 25 ainda não chegou (hoje=23) → não pago
        (v_cid, v_pid, 2026,  4, FALSE, NULL);

    RAISE NOTICE 'Seed concluído: perfil_id=%, cartões=2, compras=6, recorrentes=6.', v_pid;
END $$;
