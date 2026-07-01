import { api } from './axios'

export type TipoOperacao = 'COMPRA' | 'VENDA'
export type AssetType = 'STOCK' | 'FII' | 'TREASURY' | 'BDR' | 'ETF' | 'ETF_INT' | 'STOCK_INT'
export type Categoria = 'SWING_TRADE_ACAO' | 'DAY_TRADE_ACAO' | 'FII' | 'TREASURY' | 'BDR_ETF' | 'STOCK_INT'

export interface OperacaoResponse {
  id: number
  ticker: string
  tipo: TipoOperacao
  quantidade: number
  preco: number
  totalOperacao: number
  data: string
  dayTrade: boolean
  assetType: AssetType
}

export interface ApuracaoMensal {
  mes: string
  categoria: Categoria
  totalVendido: number
  custoVendido: number
  resultadoBruto: number
  prejuizoAnterior: number
  baseCalculo: number
  aliquota: number
  impostoDevido: number
  isento: boolean
  prejuizoGerado: number
  saldoPrejuizoFinal: number
}

export interface ResumoPorCategoria {
  categoria: Categoria
  meses: ApuracaoMensal[]
  totalImpostoDevido: number
  saldoPrejuizoAtual: number
}

export interface Apuracao {
  categorias: ResumoPorCategoria[]
  totalImpostoAno: number
}

export interface PosicaoAtual {
  ticker: string
  assetType: AssetType
  quantidadeAtual: number
  custoMedio: number
  custoTotal: number
}

export interface OperacaoRequest {
  ticker: string
  tipo: TipoOperacao
  quantidade: number
  preco: number
  data: string
  dayTrade: boolean
  assetType: AssetType
}

export interface Isentometro {
  mes: string
  totalVendido: number
  limiteIsencao: number
  percentual: number
  isento: boolean
}

export interface ImportResult {
  imported: number
  skipped: number
  duplicados: number
}

export const irApi = {
  listar: () =>
    api.get<OperacaoResponse[]>('/api/v1/ir/operacoes').then(r => r.data),

  criar: (body: OperacaoRequest) =>
    api.post<OperacaoResponse>('/api/v1/ir/operacoes', body).then(r => r.data),

  deletar: (id: number) =>
    api.delete(`/api/v1/ir/operacoes/${id}`),

  apurar: (ano?: number) =>
    api.get<Apuracao>('/api/v1/ir/apuracao', { params: ano ? { ano } : {} }).then(r => r.data),

  posicoes: () =>
    api.get<PosicaoAtual[]>('/api/v1/ir/posicoes').then(r => r.data),

  isentometro: () =>
    api.get<Isentometro>('/api/v1/ir/isentometro').then(r => r.data),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>('/api/v1/ir/operacoes/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },

  declaracaoPdf: (ano?: number) =>
    api.get('/api/v1/ir/declaracao/pdf', {
      params: ano ? { ano } : {},
      responseType: 'blob',
    }).then(r => {
      const anoStr = ano ?? new Date().getFullYear() - 1
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Declaracao_IRPF_${anoStr}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }),

  darfPdf: (mes: string, categoria: Categoria) =>
    api.get('/api/v1/ir/darf/pdf', {
      params: { mes, categoria },
      responseType: 'blob',
    }).then(r => {
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `DARF_${mes}_${categoria}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    }),
}
