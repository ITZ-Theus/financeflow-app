import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Tag, Target, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard'  },
    { to: '/transactions', icon: <ArrowLeftRight  size={18} />, label: 'Transações' },
    { to: '/categories',   icon: <Tag             size={18} />, label: 'Categorias' },
    { to: '/goals',        icon: <Target          size={18} />, label: 'Metas'      },
  ]

  return (
    <div className="app-shell">
      <aside className="app-sidebar" style={{ width: collapsed ? 68 : 240 }}>
        <div style={{ padding: collapsed ? '20px 0' : '20px 20px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>💰</div>
          {!collapsed && <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, background: 'linear-gradient(135deg, #fff, var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>FinanceFlow</span>}
        </div>
        <nav style={{ flex: 1, padding: '8px 8px' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined}
              style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, marginBottom: 4, textDecoration: 'none', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', background: isActive ? 'var(--accent-glow)' : 'transparent', fontWeight: isActive ? 600 : 400, fontSize: 14, transition: 'all 0.15s' })}>
              {item.icon}
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <div style={{ padding: '8px 12px', marginBottom: 4 }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</p>
            </div>
          )}
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}>
            <LogOut size={18} />
            {!collapsed && 'Sair'}
          </button>
        </div>
        <button onClick={() => setCollapsed(c => !c)}
          style={{ position: 'absolute', top: 20, right: -12, width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
