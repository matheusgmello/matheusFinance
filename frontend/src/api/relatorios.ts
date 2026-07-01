import { api } from './axios'

async function download(url: string, filename: string) {
  const response = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

export const relatoriosApi = {
  comprasAno: (ano: number) =>
    download(`/api/relatorios/compras.csv?ano=${ano}`, `compras-${ano}.csv`),

  gastosMes: (ano: number, mes: number) =>
    download(`/api/relatorios/gastos.csv?ano=${ano}&mes=${mes}`, `gastos-${ano}-${String(mes).padStart(2, '0')}.csv`),
}
