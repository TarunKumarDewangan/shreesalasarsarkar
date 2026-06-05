import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Users, FileText, CreditCard, BarChart2,
  LogOut, Building2, Menu, X, CheckCircle, ShieldAlert,
  MessageSquare, Trash2, Clock, Activity, ChevronDown,
  PlusCircle, GitMerge
} from 'lucide-react'
import { useState } from 'react'
import GlobalSearch from '../components/GlobalSearch'

const adminNav = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/financers', icon: Building2,        label: 'Financers' },
  { to: '/whatsapp',        icon: MessageSquare,    label: 'WhatsApp API' },
  { to: '/customers',       icon: Users,            label: 'Personal Details' },
  {
    label: 'Backlog',
    icon: Clock,
    children: [
      { to: '/backlog', label: 'Upload Backlog Data' },
      { to: '/backlog-due', label: 'Due Installment Backlog' }
    ]
  },
  {
    label: 'Accounts',
    icon: FileText,
    children: [
      { to: '/accounts/backlog-cashbook', label: 'Backlog Cashbook' },
      { to: '/accounts/new-cashbook', label: 'New Cashbook' },
      { to: '/accounts/combine-cashbook', label: 'Combine Cashbook' }
    ]
  },
  {
    label: 'Combine',
    icon: GitMerge,
    children: [
      { to: '/combine/due-installment', label: 'Combine Due Installment' },
      { to: '/combine/view-backlog', label: 'Combine View Backlog' }
    ]
  },
  { to: '/trash',           icon: Trash2,           label: 'Trash Bin' },
  { to: '/admin/audit-logs', icon: Activity,         label: 'Audit Logs' },
]

const financerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    label: 'New',
    icon: PlusCircle,
    children: [
      { to: '/borrowers/new', label: 'New Borrower' },
      { to: '/entry',         label: 'New Loan' },
      { to: '/borrowers',     label: 'Borrowers' },
      { to: '/loans',         label: 'Loans' }
    ]
  },
  { to: '/staff',     icon: Users,            label: 'Recovery Men' },
  { to: '/verify-recoveries', icon: CheckCircle,       label: 'Verify Recoveries' },
  { to: '/seized-vehicles', icon: ShieldAlert,      label: 'Seized Vehicles' },
  { to: '/reports',   icon: BarChart2,        label: 'Reports' },
  { to: '/whatsapp',  icon: MessageSquare,    label: 'WhatsApp' },
  { to: '/customers', icon: Users,            label: 'Personal Details' },
  {
    label: 'Backlog',
    icon: Clock,
    children: [
      { to: '/backlog', label: 'Upload Backlog Data' },
      { to: '/backlog-due', label: 'Due Installment Backlog' }
    ]
  },
  {
    label: 'Accounts',
    icon: FileText,
    children: [
      { to: '/accounts/backlog-cashbook', label: 'Backlog Cashbook' },
      { to: '/accounts/new-cashbook', label: 'New Cashbook' },
      { to: '/accounts/combine-cashbook', label: 'Combine Cashbook' }
    ]
  },
  {
    label: 'Combine',
    icon: GitMerge,
    children: [
      { to: '/combine/due-installment', label: 'Combine Due Installment' },
      { to: '/combine/view-backlog', label: 'Combine View Backlog' }
    ]
  },
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
  const [expandedMenus, setExpandedMenus] = useState({
    Backlog: loc.pathname.startsWith('/backlog'),
    Accounts: loc.pathname.startsWith('/accounts') || loc.pathname.startsWith('/cashbook'),
    New: loc.pathname.startsWith('/borrowers') || loc.pathname.startsWith('/entry') || loc.pathname.startsWith('/loans'),
    Combine: loc.pathname.startsWith('/combine')
  })
  const navLinks = isAdmin ? adminNav : (isStaff ? staffNav : financerNav)

  const handleLogout = async () => { await logout(); nav('/login') }

  const toggleMenu = (label) => {
    if (!open) {
      setOpen(true)
      setExpandedMenus(prev => ({ ...prev, [label]: true }))
    } else {
      setExpandedMenus(prev => ({ ...prev, [label]: !prev[label] }))
    }
  }

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
          {navLinks.map((item) => {
            const Icon = item.icon
            if (item.children) {
              const isExpanded = expandedMenus[item.label]
              const hasActiveChild = item.children.some(child => loc.pathname === child.to || (loc.pathname.startsWith(child.to) && child.to !== '/dashboard'))
              
              return (
                <div key={item.label} className="submenu-container">
                  <button 
                    onClick={() => toggleMenu(item.label)} 
                    className={`submenu-header ${hasActiveChild ? 'nav-link--active' : ''}`}
                  >
                    <Icon size={18} />
                    {open && <span className="submenu-header__label">{item.label}</span>}
                    {open && <ChevronDown size={14} className={`submenu-chevron ${isExpanded ? 'submenu-chevron--expanded' : ''}`} />}
                  </button>
                  {open && isExpanded && (
                    <div className="submenu-children">
                      {item.children.map(child => (
                        <Link
                          key={child.to} to={child.to}
                          onClick={() => setMobileOpen(false)}
                          className={`submenu-link ${loc.pathname === child.to || (loc.pathname.startsWith(child.to) && child.to !== '/dashboard') ? 'submenu-link--active' : ''}`}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.to} to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`nav-link ${loc.pathname.startsWith(item.to) && item.to !== '/dashboard' || loc.pathname === item.to ? 'nav-link--active' : ''}`}
              >
                <Icon size={18} />
                {open && <span>{item.label}</span>}
              </Link>
            )
          })}
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

        <div className="top-bar" style={{ 
          padding: '12px 32px', 
          background: 'white', 
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <GlobalSearch />
        </div>

        <div className="page-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
