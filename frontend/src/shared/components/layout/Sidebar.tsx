import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Bell, Target, LogOut, Settings, Calculator } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { alertasApi } from '../../../domains/alertas/api'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { activeProfile } = useProfile()
  const { logout, perfilNome } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  function handleLogout() {
    qc.clear()
    logout()
    navigate('/login', { replace: true })
  }

  const { data: vencimentos } = useQuery({
    queryKey: ['alertas-vencimentos', activeProfile?.id],
    queryFn: () => alertasApi.vencimentos(3),
    enabled: !!activeProfile,
    refetchInterval: 5 * 60 * 1000,
  })

  const totalAlertas = vencimentos?.totalItens ?? 0

  const navItems = [
    { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     badge: totalAlertas },
    { to: '/metas',         icon: Target,          label: 'Metas',         badge: 0 },
    { to: '/calculadoras',  icon: Calculator,      label: 'Calculadoras',  badge: 0 },
    { to: '/configuracoes', icon: Settings,        label: 'Configurações', badge: 0 },
  ]

  return (
    <aside className={`
      w-60 flex-shrink-0 bg-bg-sidebar border-r border-c-border
      flex flex-col
      fixed md:relative inset-y-0 left-0 z-50
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="p-6 border-b border-c-border flex items-center justify-between">
        <span className="text-accent-500 font-bold text-lg tracking-tight">
          matheus<span className="text-c-primary">Finance</span>
        </span>
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                  : 'text-c-muted hover:text-c-primary hover:bg-bg-elevated'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {totalAlertas > 0 && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={13} className="text-amber-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {totalAlertas} {totalAlertas === 1 ? 'item' : 'itens'} a vencer
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-500 leading-tight">
            Parcelas ou contas vencidas / vencendo em até 3 dias.
          </p>
        </div>
      )}

      <div className="p-4 border-t border-c-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-accent-600 dark:text-accent-400 text-sm font-bold flex-shrink-0">
            {(perfilNome ?? activeProfile?.nome ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-c-primary truncate">
              {perfilNome ?? activeProfile?.nome ?? 'Sem perfil'}
            </p>
            <p className="text-xs text-c-muted">Perfil ativo</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="text-c-muted hover:text-rose-500 transition flex-shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
