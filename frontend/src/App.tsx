import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './shared/components/layout'
import { ErrorBoundary } from './shared/components/ErrorBoundary'
import DashboardPage from './pages/dashboard/DashboardPage'
import ConfiguracoesPage from './pages/configuracoes/ConfiguracoesPage'
import InvestimentosPage from './pages/investimentos/InvestimentosPage'
import MetasPage from './pages/metas/MetasPage'
import IrPage from './pages/ir/IrPage'
import CalculadorasPage from './pages/calculadoras/CalculadorasPage'
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
        <Route path="investimentos" element={<ErrorBoundary><InvestimentosPage /></ErrorBoundary>} />
        <Route path="categorias" element={<Navigate to="/" replace />} />
        <Route path="metas" element={<ErrorBoundary><MetasPage /></ErrorBoundary>} />
        <Route path="ir" element={<ErrorBoundary><IrPage /></ErrorBoundary>} />
        <Route path="calculadoras" element={<ErrorBoundary><CalculadorasPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
