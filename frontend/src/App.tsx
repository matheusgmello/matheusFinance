import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './shared/components/layout'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import DashboardPage from './pages/dashboard/DashboardPage'
import ConfiguracoesPage from './pages/configuracoes/ConfiguracoesPage'
import MetasPage from './pages/metas/MetasPage'
import CalculadorasPage from './pages/calculadoras/CalculadorasPage'
import ImportarFaturaPage from './pages/fatura/ImportarFaturaPage'
import FaturaPage from './pages/fatura/FaturaPage'
import CartoesPage from './pages/cartoes/CartoesPage'
import ComprasPage from './pages/compras/ComprasPage'
import RecorrentesPage from './pages/recorrentes/RecorrentesPage'
import OrcamentosPage from './pages/orcamentos/OrcamentosPage'
import CategoriasPage from './pages/categorias/CategoriasPage'
import RelatoriosPage from './pages/relatorios/RelatoriosPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route element={<AppShell />}>
        <Route index element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
        <Route path="configuracoes" element={<ErrorBoundary><ConfiguracoesPage /></ErrorBoundary>} />
        <Route path="perfis" element={<Navigate to="/configuracoes" replace />} />
        <Route path="metas" element={<ErrorBoundary><MetasPage /></ErrorBoundary>} />
        <Route path="calculadoras" element={<ErrorBoundary><CalculadorasPage /></ErrorBoundary>} />
        <Route path="fatura" element={<ErrorBoundary><FaturaPage /></ErrorBoundary>} />
        <Route path="fatura/importar" element={<ErrorBoundary><ImportarFaturaPage /></ErrorBoundary>} />
        <Route path="cartoes" element={<ErrorBoundary><CartoesPage /></ErrorBoundary>} />
        <Route path="compras" element={<ErrorBoundary><ComprasPage /></ErrorBoundary>} />
        <Route path="recorrentes" element={<ErrorBoundary><RecorrentesPage /></ErrorBoundary>} />
        <Route path="orcamentos" element={<ErrorBoundary><OrcamentosPage /></ErrorBoundary>} />
        <Route path="categorias" element={<ErrorBoundary><CategoriasPage /></ErrorBoundary>} />
        <Route path="relatorios" element={<ErrorBoundary><RelatoriosPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
