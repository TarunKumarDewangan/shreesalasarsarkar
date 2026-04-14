import { useEffect, useState } from 'react'
import { Calendar, CreditCard, ChevronDown, CheckCircle, Clock } from 'lucide-react'
import api from '../api'
import { fmtDate, fmtCurrency } from '../utils'

export default function BorrowerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user && user.latest_loan) {
      setData(user)
      setLoading(false)
    } else {
      // Fetch latest data if needed
      window.location.href = '/borrower/login'
    }
  }, [])

  if (loading || !data) return <div className="loading-text">Loading profile...</div>

  const loan = data.latest_loan
  const installments = loan.installments || []
  const paidCount = installments.filter(i => i.status === 'PAID').length
  const progress = (paidCount / installments.length) * 100

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px 80px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>नमस्ते, {data.name}!</h1>
        <p style={{ opacity: 0.6, marginTop: 4 }}>आपका ऋण सारांश (Your Loan Summary)</p>
      </header>

      {/* Loan Progress Card */}
      <div className="card" style={{ padding: 24, borderRadius: 24, background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)', color: 'white', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Loan Amount</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>₹{fmtCurrency(loan.gross_amount)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>Active</div>
        </div>

        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ opacity: 0.8 }}>Repayment Progress</span>
          <span>{paidCount} / {installments.length} Payed</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'white', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 16, borderRadius: 20 }}>
          <div style={{ opacity: 0.5, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>EMI Amount</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>₹{fmtCurrency(loan.installment_amount)}</div>
        </div>
        <div className="card" style={{ padding: 16, borderRadius: 20 }}>
          <div style={{ opacity: 0.5, fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Vehicle No.</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{data.vehicle?.vehicle_no || 'NA'}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>किस्त विवरण (Installments)</h3>
      <div className="card" style={{ padding: 8, borderRadius: 24 }}>
        {installments.map((ins, idx) => (
          <div key={ins.id} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: idx === installments.length - 1 ? 'none' : '1px solid var(--primary-bg)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: ins.status === 'PAID' ? '#dcfce7' : '#f1f5f9', color: ins.status === 'PAID' ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              {ins.status === 'PAID' ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{fmtDate(ins.due_date)}</div>
              <div style={{ fontSize: 12, opacity: 0.5 }}>Installment #{idx + 1}</div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, background: 'rgba(var(--primary-rgb), 0.05)', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
                <strong style={{ opacity: 0.5 }}>P:</strong> ₹{fmtCurrency(ins.principal_amount)} | <strong style={{ opacity: 0.5 }}>I:</strong> ₹{fmtCurrency(ins.interest_amount)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.amount_due)}</div>
              <div style={{ fontSize: 10, fontWeight: 700 }}>
                {ins.status === 'PAID' ? (
                  <span style={{ color: '#16a34a' }}>PAID</span>
                ) : ins.pending_recovery_count > 0 ? (
                  <span style={{ color: '#f59e0b' }}>SENT</span>
                ) : (
                  <span style={{ color: '#dc2626' }}>SEND FOR SCRUITY</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={() => { localStorage.clear(); window.location.href = '/borrower/login'; }}
        style={{ width: '100%', marginTop: 40, padding: 16, borderRadius: 16, border: '1px solid var(--primary-bg)', background: 'white', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}
      >
        Logout Securely
      </button>
    </div>
  )
}
