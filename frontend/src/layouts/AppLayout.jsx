import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, FileText, CreditCard, BarChart2,
  LogOut, Building2, Menu, X, CheckCircle, ShieldAlert,
  MessageSquare, Trash2
} from 'lucide-react'
import { useState } from 'react'

const adminNav = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/financers', icon: Building2,        label: 'Financers' },
  { to: '/whatsapp',        icon: MessageSquare,    label: 'WhatsApp API' },
  { to: '/customers',       icon: Users,            label: 'Personal Details' },
  { to: '/trash',           icon: Trash2,           label: 'Trash Bin' },
]

const financerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entry',     icon: FileText,         label: 'New Entry' },
  { to: '/borrowers', icon: Users,            label: 'Borrowers' },
  { to: '/loans',     icon: CreditCard,       label: 'Loans' },
  { to: '/staff',     icon: Users,            label: 'Recovery Men' },
  { to: '/verify-recoveries', icon: CheckCircle,       label: 'Verify Recoveries' },
  { to: '/seized-vehicles', icon: ShieldAlert,      label: 'Seized Vehicles' },
  { to: '/reports',   icon: BarChart2,        label: 'Reports' },
  { to: '/whatsapp',  icon: MessageSquare,    label: 'WhatsApp' },
  { to: '/customers', icon: Users,            label: 'Personal Details' },
  { to: '/trash',     icon: Trash2,           label: 'Trash Bin' },
]

const staffNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/borrowers', icon: Users,            label: 'Borrowers' },
  { to: '/loans',     icon: CreditCard,       label: 'Loans' },
]

export default function AppLayout() {
  const { user, logout, isAdmin, isStaff } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navLinks = isAdmin ? adminNav : (isStaff ? staffNav : financerNav)

  const handleLogout = async () => { await logout(); nav('/login') }

  return (
    <div className={`app-shell ${open ? '' : 'sidebar--collapsed'} ${mobileOpen ? 'mobile--open' : ''}`}>
      {/* Mobile Overlay */}
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'sidebar--open' : 'sidebar--closed'}`}>
        <div className="sidebar__brand">
          {open && <span className="brand-text" style={{ fontSize: 15, letterSpacing: -0.5 }}>Shree Salasar Sarkar</span>}
          <button className="sidebar__toggle" onClick={() => setOpen(!open)} style={{ marginLeft: open ? 0 : 'auto' }}>
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        <nav className="sidebar__nav">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link
              key={to} to={to}
              onClick={() => setMobileOpen(false)}
              className={`nav-link ${loc.pathname.startsWith(to) && to !== '/dashboard' || loc.pathname === to ? 'nav-link--active' : ''}`}
            >
              <Icon size={18} />
              {open && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar__footer">
          {open && (
            <div className="sidebar__user">
              <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18}/>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`main-content ${open ? '' : 'main-content--collapsed'}`}>
        <header className="page-header--mobile">
          <button onClick={() => setMobileOpen(true)} aria-label="Open Menu">
            <Menu size={22}/>
          </button>
          <span style={{ fontSize: 16, letterSpacing: -0.5 }}>Shree Salasar Sarkar</span>
        </header>
        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
