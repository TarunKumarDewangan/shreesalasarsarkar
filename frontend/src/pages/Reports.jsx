import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Filter, TrendingUp, AlertCircle, CheckCircle2, Search, ArrowRight, Download, X } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import { useAuth } from '../contexts/AuthContext'
import PayModal from '../components/PayModal'

export default function Reports() {
  const { isStaff } = useAuth()
  const [data, setData] = useState([])
  const [stats, setStats] = useState({ total_receivable: 0, total_received: 0, total_pending: 0, overdue_count: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    q: '',
    min_percent: '',
    max_percent: '',
    only_overdue: false,
    only_pending: false,
    only_completed: false,
    start_date: '',
    end_date: ''
  })

  // Quick-View states
  const [selected, setSelected] = useState(null)
  const [installments, setInstallments] = useState([])
  const [insLoading, setInsLoading] = useState(false)
  const [payModal, setPayModal] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/reports/recovery', { params: filters })
      .then(r => {
        const borrowers = r.data.data.data || []
        setData(borrowers)
        setStats(r.data.stats)
        if (selected && !borrowers.find(b => b.id === selected.id)) setSelected(null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selected?.latest_loan) {
      setInsLoading(true)
      api.get(`/loans/${selected.latest_loan.id}/installments`)
        .then(r => setInstallments(r.data))
        .finally(() => setInsLoading(false))
    } else {
      setInstallments([])
    }
  }, [selected?.id])

  const payIns = async (id, data) => {
    try {
      if (isStaff) {
        const baseAmount = parseFloat(payModal.amount_due || 0)
        const penalty = parseFloat(data.penalty || 0)
        const discount = parseFloat(data.discount || 0)
        const payload = {
          borrower_id: selected?.id,
          amount: baseAmount + penalty - discount,
          collection_date: data.paid_date,
          notes: data.notes,
          installment_id: payModal.id,
          penalty: data.penalty,
          discount: data.discount,
          payment_method: data.method,
          receipt_no: data.receipt_no,
          paid_date: data.paid_date
        }
        await api.post('/recoveries', payload)
        alert('Recovery payment submitted for verification.')
      } else {
        await api.patch(`/installments/${id}/pay`, data)
      }
      
      // Refresh installments
      if (selected?.latest_loan?.id) {
        const r = await api.get(`/loans/${selected.latest_loan.id}/installments`)
        setInstallments(r.data)
      }
      load()
      setPayModal(null)
    } catch (e) {
      alert(e.response?.data?.message || 'Payment failed')
    }
  }

  const handleFilterChange = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  return (
    <div className="reports-container">
      <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Recovery Analysis</h1>
          <p style={{ color: 'var(--text-muted)' }}>Financial health and recovery segmentation</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn--secondary" onClick={() => window.print()}>
            <Download size={16} style={{ marginRight: 8 }} /> Export PDF
          </button>
          <button className="btn btn--primary" onClick={load}>
            <Search size={16} style={{ marginRight: 8 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Analytics Snapshot - Compact Boxes */}
      <div className="reports-stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="report-mini-card">
          <div className="mini-card__label">Total Receivable</div>
          <div className="mini-card__value">₹{fmtCurrency(stats.total_receivable)}</div>
          <div className="mini-card__icon" style={{ color: 'var(--primary)' }}><TrendingUp size={16}/></div>
        </div>
        <div className="report-mini-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="mini-card__label">Total Paid</div>
          <div className="mini-card__value" style={{ color: '#10b981' }}>₹{fmtCurrency(stats.total_received)}</div>
          <div className="mini-card__icon" style={{ color: '#10b981' }}><CheckCircle2 size={16}/></div>
        </div>
        <div className="report-mini-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="mini-card__label">Total Pending</div>
          <div className="mini-card__value" style={{ color: '#ef4444' }}>₹{fmtCurrency(stats.total_pending)}</div>
          <div className="mini-card__icon" style={{ color: '#ef4444' }}><AlertCircle size={16}/></div>
        </div>
        <div className="report-mini-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="mini-card__label">Overdue Items</div>
          <div className="mini-card__value" style={{ color: '#f59e0b' }}>{stats.overdue_count}</div>
          <div className="mini-card__icon" style={{ color: '#f59e0b' }}><Filter size={16}/></div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card shadow-sm" style={{ padding: '16px 20px', marginBottom: 24, background: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label className="form-label--xs">Search Query</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input type="text" className="form-control form-control--sm" style={{ paddingLeft: 32 }} placeholder="Name, mobile, folio, address..." value={filters.q} onChange={e => handleFilterChange('q', e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
            </div>
          </div>

          <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
            <label className="form-label--xs">Recovery Range (%)</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="number" className="form-control form-control--sm" placeholder="Min" value={filters.min_percent} onChange={e => handleFilterChange('min_percent', e.target.value)} />
              <span style={{ fontSize: 12, opacity: 0.5 }}>-</span>
              <input type="number" className="form-control form-control--sm" placeholder="Max" value={filters.max_percent} onChange={e => handleFilterChange('max_percent', e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
            <label className="form-label--xs">Period (Due Date)</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" className="form-control form-control--sm" value={filters.start_date} onChange={e => handleFilterChange('start_date', e.target.value)} />
              <span style={{ fontSize: 12, opacity: 0.5 }}>to</span>
              <input type="date" className="form-control form-control--sm" value={filters.end_date} onChange={e => handleFilterChange('end_date', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 16, height: 16 }} checked={filters.only_overdue} onChange={e => handleFilterChange('only_overdue', e.target.checked)} />
              Overdue
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 16, height: 16 }} checked={filters.only_pending} onChange={e => handleFilterChange('only_pending', e.target.checked)} />
              Pending
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" style={{ width: 16, height: 16 }} checked={filters.only_completed} onChange={e => handleFilterChange('only_completed', e.target.checked)} />
              Completed
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary btn--sm" style={{ height: 36, padding: '0 20px' }} onClick={load}>Apply</button>
            <button className="btn btn--outline btn--sm" style={{ height: 36 }} onClick={() => {
              const reset = { q: '', min_percent: '', max_percent: '', only_overdue: false, only_pending: false, only_completed: false, start_date: '', end_date: '' }
              setFilters(reset)
              api.get('/reports/recovery', { params: reset }).then(r => { 
                setData(r.data.data.data || []); 
                setStats(r.data.stats); 
              })
            }}>Reset</button>
          </div>
        </div>
      </div>

      <div className="borrowers-layout">
        <div className="borrowers-main">
          {/* Results Table */}
          <div className="card shadow-sm overflow-hidden" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing recovery data...</div>
            ) : (
              <div className="table-wrap">
                <table className="table--high-density">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}></th>
                      <th>Folio</th>
                      <th>Borrower Name</th>
                      <th>Vehicle No</th>
                      <th style={{ textAlign: 'center' }}>Installments</th>
                      <th style={{ textAlign: 'center' }}>Performance</th>
                      <th style={{ textAlign: 'right' }}>Recovery %</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(b => (
                      <tr key={b.id} className={selected?.id === b.id ? 'row-selected' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                            checked={selected?.id === b.id} 
                            onChange={() => setSelected(selected?.id === b.id ? null : b)} 
                          />
                        </td>
                        <td className="td-mono">{b.folio_prefix}-{b.folio_no}</td>
                        <td>
                          <Link to={`/borrowers/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }} className="hover:underline">{b.name}</div>
                          </Link>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.mobile}</div>
                        </td>
                        <td className="td-mono">{b.vehicle?.vehicle_no || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{b.latest_loan?.paid_ins}</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>/</span>
                          <span style={{ color: 'var(--text-muted)' }}>{b.latest_loan?.total_ins}</span>
                        </td>
                        <td style={{ width: 140 }}>
                          <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${b.recovery_percentage}%`, background: b.recovery_percentage > 70 ? '#10b981' : b.recovery_percentage > 30 ? '#f59e0b' : '#ef4444' }}></div>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>
                          <span style={{ color: b.recovery_percentage > 70 ? '#10b981' : b.recovery_percentage > 30 ? '#f59e0b' : '#ef4444' }}>
                            {b.recovery_percentage}%
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {b.latest_loan?.overdue_ins > 0 ? (
                            <span className="badge badge--danger" style={{ fontSize: 10 }}>{b.latest_loan.overdue_ins} Overdue</span>
                          ) : (
                            <span className="badge badge--success" style={{ fontSize: 10 }}>On Track</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <a href={`/borrowers?id=${b.id}`} className="btn btn--xs btn--outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            View Detail <ArrowRight size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                          No records match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="card side-panel animate-in" style={{ flex: '1 1 35%', position: 'sticky', top: 20, minWidth: 320 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Finance Status View</span>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}><X size={16}/></button>
            </div>
            <div className="card-body" style={{ padding: 20 }}>
              <div className="view-section">
                <label>IDENTITY</label>
                <div className="view-grid">
                  <div className="view-item"><span>Folio:</span> <strong>{selected.folio_prefix}-{selected.folio_no}</strong></div>
                  <div className="view-item"><span>Name:</span> <strong>{selected.name}</strong></div>
                  <div className="view-item"><span>Mobile:</span> {selected.mobile}</div>
                  <div className="view-item" style={{ gridColumn: 'span 2' }}><span>Address:</span> {selected.address}</div>
                </div>
              </div>

              {selected.latest_loan ? (
                <div className="view-section">
                  <label>FINANCE & INSTALLMENTS</label>
                  <div className="stats-mini">
                    <div className="stat-mini">
                      <div className="stat-mini__val">{selected.latest_loan.paid_ins} / {selected.latest_loan.total_ins}</div>
                      <div className="stat-mini__label">Installments Paid</div>
                    </div>
                    <div className="stat-mini">
                      <div className="stat-mini__val" style={{ color: 'var(--danger)' }}>{selected.latest_loan.overdue_ins}</div>
                      <div className="stat-mini__label">Overdue</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, opacity:0.6 }}>ALL INSTALLMENTS</span>
                    </div>
                    {insLoading ? <p className="loading-text" style={{ padding: 10 }}>Loading ledger...</p> : (
                      <div className="mini-ledger" style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {installments.map(ins => (
                          <div key={ins.id} className="mini-ledger-item" style={{ opacity: ins.status === 'PAID' ? 0.6 : 1, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>₹{fmtCurrency(ins.amount_due)}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                Due: {fmtDate(ins.due_date)} 
                              </div>
                            </div>
                            {ins.status === 'PAID' ? (
                              <span className="badge badge--success" style={{ fontSize: 9, padding: '2px 8px' }}>PAID</span>
                            ) : ins.pending_recovery_count > 0 ? (
                              <span className="badge badge--warning" style={{ fontSize: 9, padding: '2px 8px' }}>SENT</span>
                            ) : (
                              <button className="btn btn--primary btn--xs" onClick={() => setPayModal(ins)} style={{fontSize: '9px', whiteSpace: 'nowrap'}}>
                                SEND FOR SCRUITY
                              </button>
                            )}
                          </div>
                        ))}
                        {installments.length === 0 && (
                          <div style={{ fontSize: 11, textAlign: 'center', padding: 10, color: 'var(--text-muted)' }}>No installments found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="view-grid" style={{ marginTop: 12 }}>
                    <div className="view-item"><span>Gross:</span> ₹{fmtCurrency(selected.latest_loan.gross_amount)}</div>
                    <div className="view-item"><span>Installment:</span> ₹{fmtCurrency(selected.latest_loan.installment_amount)}</div>
                    <div className="view-item"><span>Status:</span> <span className="badge badge--success">{selected.latest_loan.status}</span></div>
                  </div>
                </div>
              ) : (
                <div className="alert alert--info" style={{ marginTop: 12, fontSize: 12 }}>No active finance record found.</div>
              )}
            </div>
          </div>
        )}
      </div>
      {payModal && (
        <PayModal 
          installment={payModal} 
          allInstallments={installments}
          onPay={data => payIns(payModal.id, data)} 
          onClose={() => setPayModal(null)} 
          isStaff={isStaff}
        />
      )}
    </div>
  )
}
