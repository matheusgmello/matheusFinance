#!/usr/bin/env bash
# Popula um perfil "Demo" via API real (respeita as regras de negócio,
# não insere direto no banco). Dado sintético, seguro pra versionar e
# reexecutar — não usa nenhum arquivo de fatura pessoal.
#
# Uso: backend/scripts/seed-demo.sh [base_url]
# Requer: backend rodando (padrão http://localhost:8085), curl, python3.

set -euo pipefail

BASE_URL="${1:-http://localhost:8085}"
USUARIO="demo"
SENHA="demo1234"

json_get() { python3 -c "import sys,json; print(json.load(sys.stdin)$1)"; }

echo "Registrando usuário '$USUARIO'..."
REGISTER_RESP=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"usuario\":\"$USUARIO\",\"senha\":\"$SENHA\",\"confirmarSenha\":\"$SENHA\"}")

if echo "$REGISTER_RESP" | grep -q '"status":409'; then
  echo "Usuário já existe, fazendo login..."
  RESP=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"usuario\":\"$USUARIO\",\"senha\":\"$SENHA\"}")
else
  RESP="$REGISTER_RESP"
fi

TOKEN=$(echo "$RESP" | json_get "['token']")
PERFIL=$(echo "$RESP" | json_get "['perfilId']")
AUTH=(-H "Authorization: Bearer $TOKEN" -H "X-Perfil-Id: $PERFIL" -H "Content-Type: application/json")

api() { curl -s -X "$1" "$BASE_URL$2" "${AUTH[@]}" -d "$3"; }

echo "Criando cartões..."
NUBANK_ID=$(api POST /api/cartoes '{"nome":"Nubank","diaVencimento":10,"diaFechamento":3}' | json_get "['id']")
ITAU_ID=$(api POST /api/cartoes '{"nome":"Itaú","diaVencimento":5,"diaFechamento":28}' | json_get "['id']")

echo "Criando categorias..."
api POST /api/categorias '{"nome":"Mercado","cor":"emerald"}' >/dev/null
api POST /api/categorias '{"nome":"Transporte","cor":"blue"}' >/dev/null
api POST /api/categorias '{"nome":"Lazer","cor":"violet"}' >/dev/null
api POST /api/categorias '{"nome":"Assinaturas","cor":"amber"}' >/dev/null
api POST /api/categorias '{"nome":"Casa","cor":"orange"}' >/dev/null

HOJE=$(date +%Y-%m-%d)
MES_PASSADO=$(date -d "-1 month" +%Y-%m-%d 2>/dev/null || date -v-1m +%Y-%m-%d)

echo "Criando compras (à vista e parceladas, nos dois cartões)..."
api POST /api/compras "{\"cartaoId\":$NUBANK_ID,\"descricao\":\"Supermercado Pao de Acucar\",\"valorTotal\":312.40,\"numParcelas\":1,\"dataCompra\":\"$HOJE\",\"categoria\":\"Mercado\"}" >/dev/null
api POST /api/compras "{\"cartaoId\":$NUBANK_ID,\"descricao\":\"Uber\",\"valorTotal\":28.90,\"numParcelas\":1,\"dataCompra\":\"$HOJE\",\"categoria\":\"Transporte\"}" >/dev/null
api POST /api/compras "{\"cartaoId\":$NUBANK_ID,\"descricao\":\"Notebook Dell\",\"valorTotal\":3600.00,\"numParcelas\":12,\"dataCompra\":\"$MES_PASSADO\",\"categoria\":\"Casa\"}" >/dev/null
api POST /api/compras "{\"cartaoId\":$ITAU_ID,\"descricao\":\"Cinema\",\"valorTotal\":64.00,\"numParcelas\":1,\"dataCompra\":\"$HOJE\",\"categoria\":\"Lazer\"}" >/dev/null
api POST /api/compras "{\"cartaoId\":$ITAU_ID,\"descricao\":\"Spotify\",\"valorTotal\":21.90,\"numParcelas\":1,\"dataCompra\":\"$HOJE\",\"categoria\":\"Assinaturas\"}" >/dev/null
api POST /api/compras "{\"cartaoId\":$ITAU_ID,\"descricao\":\"Fogao Novo\",\"valorTotal\":1800.00,\"numParcelas\":6,\"dataCompra\":\"$MES_PASSADO\",\"categoria\":\"Casa\"}" >/dev/null

echo "Criando orçamentos..."
api POST /api/orcamentos '{"categoria":"Mercado","valorLimite":800.00}' >/dev/null
api POST /api/orcamentos '{"categoria":"Transporte","valorLimite":300.00}' >/dev/null
api POST /api/orcamentos '{"categoria":"Lazer","valorLimite":200.00}' >/dev/null

echo "Criando recorrente (pagamento fixo)..."
api POST /api/recorrentes '{"empresa":"Academia","valor":99.90,"diaVencimento":15,"categoria":"Lazer"}' >/dev/null

echo "Definindo receita do mês..."
curl -s -X PUT "$BASE_URL/api/receitas" "${AUTH[@]}" -d '{"valor":5000.00}' >/dev/null

echo "Criando meta..."
api POST /api/metas '{"nome":"Viagem","valorAlvo":5000.00,"valorAtual":1200.00,"prazo":"'"$(date -d "+6 month" +%Y-%m-%d 2>/dev/null || date -v+6m +%Y-%m-%d)"'"}' >/dev/null

echo ""
echo "Perfil Demo pronto — login: $USUARIO / $SENHA"
