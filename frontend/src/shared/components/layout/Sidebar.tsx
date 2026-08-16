import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Bell, Target, LogOut, Settings, Calculator, Upload,
  CreditCard, Receipt, ShoppingBag, Repeat, Wallet, Tag, FileBarChart,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProfile } from '../../context/ProfileContext'
import { useAuth } from '../../context/AuthContext'
import { alertasApi } from '../../../domains/alertas/api'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  icon: typeof LayoutDashboard
  label: string
  badge?: number
}

interface NavGroup {
  label: string
  items: NavItem[]
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

  const groups: NavGroup[] = [
    {
      label: 'Painel',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Painel Geral', badge: totalAlertas },
      ],
    },
    {
      label: 'Fatura',
      items: [
        { to: '/fatura', icon: Receipt, label: 'Fatura do Mês' },
        { to: '/fatura/importar', icon: Upload, label: 'Importar Fatura' },
        { to: '/cartoes', icon: CreditCard, label: 'Cartões' },
        { to: '/compras', icon: ShoppingBag, label: 'Compras' },
        { to: '/recorrentes', icon: Repeat, label: 'Recorrentes' },
        { to: '/orcamentos', icon: Wallet, label: 'Orçamentos' },
        { to: '/categorias', icon: Tag, label: 'Categorias' },
        { to: '/relatorios', icon: FileBarChart, label: 'Relatórios' },
      ],
    },
    {
      label: 'Planejamento',
      items: [
        { to: '/metas', icon: Target, label: 'Metas' },
        { to: '/calculadoras', icon: Calculator, label: 'Calculadoras' },
      ],
    },
  ]

  return (
    <aside className={`
      w-64 flex-shrink-0 bg-bg-sidebar border-r border-c-border
      flex flex-col
      fixed md:relative inset-y-0 left-0 z-50
      transition-transform duration-200 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="px-5 py-5 border-b border-c-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm tracking-wide text-c-primary leading-none">
              SLOPFINANCE
            </p>
            <p className="text-[10px] uppercase tracking-widest text-c-muted mt-1">
              Controle financeiro
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-c-muted hover:text-c-primary"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {groups.map(group => (
          <div key={group.label} className="mb-1">
            <p className="px-5 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-c-muted/70">
              {group.label}
            </p>
            {group.items.map(({ to, icon: Icon, label, badge }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2 text-sm font-medium border-l-2 transition-colors ${
                    isActive
                      ? 'border-accent-500 text-accent-500 bg-bg-elevated'
                      : 'border-transparent text-c-muted hover:text-c-primary hover:bg-bg-elevated'
                  }`
                }
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {!!badge && badge > 0 && (
                  <span className="min-w-[22px] px-1 text-center rounded-full bg-overdue text-white text-[11px] font-bold">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {totalAlertas > 0 && (
        <div className="mx-4 mb-2 p-3 rounded-xl bg-due/10 border border-due/30">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={13} className="text-due flex-shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wide text-due">
              {totalAlertas} {totalAlertas === 1 ? 'item' : 'itens'} a vencer
            </span>
          </div>
          <p className="text-xs text-c-muted leading-tight">
            Parcelas ou contas vencidas / vencendo em até 3 dias.
          </p>
        </div>
      )}

      <NavLink
        to="/configuracoes"
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-5 py-2 text-sm font-medium border-l-2 border-t border-c-border transition-colors ${
            isActive
              ? 'border-l-accent-500 text-accent-500 bg-bg-elevated'
              : 'border-l-transparent text-c-muted hover:text-c-primary hover:bg-bg-elevated'
          }`
        }
      >
        <Settings size={16} />
        <span className="flex-1">Configurações</span>
      </NavLink>

      <div className="p-4 border-t border-c-border">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-8 h-8 rounded-full bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-500 text-sm font-bold flex-shrink-0">
            {(perfilNome ?? activeProfile?.nome ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-c-primary truncate">
              {perfilNome ?? activeProfile?.nome ?? 'Sem perfil'}
            </p>
            <p className="text-xs text-c-muted uppercase tracking-wide">Perfil ativo</p>
          </div>
          <button onClick={handleLogout} title="Sair" className="text-c-muted hover:text-overdue transition flex-shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
