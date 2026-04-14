import { useEffect, useState } from 'react'
import api from '../api'
import { Users, CreditCard, AlertCircle, TrendingUp } from 'lucide-react'
import { fmtCurrency } from '../utils'

const fmt = (n) => {
  if (n >= 1_00_000) return '₹' + (n / 1_00_000).toFixed(1) + 'L'
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'K'
  return '₹' + fmtCurrency(n)
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setStats(r.data))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats ? [
    {
      label: 'Total Borrowers',
      value: stats.total_borrowers,
      icon: Users,
      color: 'var(--primary)',
      bg: 'var(--primary-bg)',
    },
    {
      label: 'Active Loans',
      value: stats.active_loans,
      icon: CreditCard,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
    },
    {
      label: 'Pending Installments',
      value: stats.pending_installments,
      icon: AlertCircle,
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
    },
    {
      label: 'Collected Today',
      value: fmt(stats.collected_today || 0),
      icon: TrendingUp,
      color: 'var(--primary)',
      bg: 'var(--primary-bg)',
      raw: true,
    },
    {
      label: 'Collected This Month',
      value: fmt(stats.collected_this_month || 0),
      icon: TrendingUp,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      raw: true,
    },
  ] : []

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your finance portfolio</p>
      </div>

      {loading ? (
        <p className="loading-text">Loading stats…</p>
      ) : (
        <div className="stats-grid">
          {cards.map(({ label, value, icon: Icon, color, bg, raw }) => (
            <div className="stat-card" key={label}>
              <div className="stat-card__icon" style={{ background: bg }}>
                <Icon size={20} color={color} />
              </div>
              <div className="stat-card__label">{label}</div>
              <div className="stat-card__value">{raw ? value : fmtCurrency(value)}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
