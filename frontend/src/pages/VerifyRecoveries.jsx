import { useEffect, useState } from 'react'
import api from '../api'
import { CheckCircle, XCircle, X, Clock, Search, MapPin, User, Calendar, Filter, RotateCcw, ChevronRight, Phone, Loader2 } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import PremiumSearch from '../components/PremiumSearch'

export default function VerifyRecoveries() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = (s = filter, q = search, start = startDate, end = endDate) => {
    setLoading(true)
    api.get('/recoveries', { 
      params: { 
        status: s, 
        search: q,
        start_date: start,
        end_date: end
      } 
    })
      .then(r => setList(r.data.data || r.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load(filter, search, startDate, endDate)
    }, 400)
    return () => clearTimeout(timer)
  }, [filter, search, startDate, endDate])

  const [approveModal, setApproveModal] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)

  const handleApprove = async (id) => {
    try {
        await api.patch(`/recoveries/${id}/approve`)
        load()
    } catch (e) {
        throw e
    }
  }

  const handleReject = async (id) => {
    try {
        await api.patch(`/recoveries/${id}/reject`)
        load()
    } catch (e) {
        throw e
    }
  }

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setStartDate(today)
    setEndDate(today)
  }

  const resetFilters = () => {
    setSearch('')
    setStartDate('')
    setEndDate('')
    setFilter('PENDING')
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Verify Recoveries</h1>
          <p>Approve or reject payments collected by staff in real-time</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
           <button className="btn btn--outline" onClick={resetFilters}>
             <RotateCcw size={16} /> Reset
           </button>
        </div>
      </div>

      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
        <PremiumSearch 
          placeholder="Search borrower by name or mobile..." 
          onSearch={setSearch}
          results={list.slice(0, 5).map(r => ({ ...r.borrower, id: r.id, type: 'CUSTOMER', amount: r.amount }))}
          loading={loading}
          onSelect={(item) => setSearch(item.name)}
        />
      </div>

      <div className="card toolbar" style={{ padding: '16px 20px', marginBottom: 28, background: 'var(--card)', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
            <button 
              key={s} 
              className={`btn btn--sm ${filter === s ? 'btn--primary' : 'btn--ghost'}`}
              style={{ borderRadius: 8, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: filter === s ? '#fff' : 'var(--text-muted)' }}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', letterSpacing: 0.5 }}>DATE RANGE</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="date" className="form-control form-control--sm" style={{ width: 140 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span style={{ fontSize: 12, opacity: 0.4 }}>TO</span>
                <input type="date" className="form-control form-control--sm" style={{ width: 140 }} value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <button className="btn btn--outline btn--sm" style={{ marginTop: 18 }} onClick={setToday}>Show Today</button>
        </div>
        
        <div className="toolbar-spacer"></div>
        
        {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
            <Loader2 className="animate-spin" size={16} /> Syncing
        </div>}
      </div>

      {loading && list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 120 }}>
          <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)', opacity: 0.2 }} />
          <p style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Fetching recovery vouchers...</p>
        </div>
      ) : (
        <div className="customer-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', display: 'grid', gap: 24 }}>
          {list.length === 0 ? (
            <div className="card" style={{ padding: 80, textAlign: 'center', gridColumn: '1 / -1', opacity: 0.8, border: '2px dashed var(--border)', background: 'transparent' }}>
              <Clock size={52} style={{ opacity: 0.1, marginBottom: 20, margin: '0 auto' }} />
              <h3 style={{ fontSize: 18, color: 'var(--text)' }}>No {filter.toLowerCase()} recoveries found</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Adjust your filters or try a different search query.</p>
              <button className="btn btn--primary btn--sm" style={{ marginTop: 24 }} onClick={resetFilters}>Clear All Filters</button>
            </div>
          ) : list.map(r => (
            <div key={r.id} className="card animate-in hover-glow" style={{ overflow: 'hidden', borderLeft: filter === 'PENDING' ? '5px solid var(--warning)' : filter === 'APPROVED' ? '5px solid var(--success)' : '5px solid var(--danger)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 20, borderRadius: 14 }}>{r.borrower?.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 2 }}>{r.borrower?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={11} /> {r.borrower?.mobile || 'No Mobile'}
                        <span style={{ opacity: 0.3 }}>•</span>
                        ID: #{r.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: -1 }}>₹{fmtCurrency(r.amount)}</div>
                    <div className="badge badge--success" style={{ fontSize: 9, padding: '3px 10px', background: 'var(--primary-bg)', color: 'var(--primary)' }}>{r.payment_method || 'CASH'}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 14, marginBottom: 20, border: '1px solid var(--border)' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
                      <div className="view-item"><span>Collected By:</span> <strong>{r.staff?.name}</strong></div>
                      <div className="view-item"><span>Date:</span> <strong>{fmtDate(r.collection_date)}</strong></div>
                      {r.receipt_no && <div className="view-item"><span>Receipt No:</span> <span className="td-mono" style={{ fontWeight: 800, color: 'var(--primary)' }}>{r.receipt_no}</span></div>}
                      {r.penalty > 0 && <div className="view-item"><span>Penalty:</span> <span style={{ color: 'var(--danger)', fontWeight: 800 }}>₹{fmtCurrency(r.penalty)}</span></div>}
                      <div className="view-item" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                        <MapPin size={14} style={{ marginTop: 2, opacity: 0.4 }} />
                        <span style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.8 }}>{r.borrower?.address}</span>
                      </div>
                   </div>
                </div>

                {r.notes && (
                  <div style={{ padding: '10px 14px', background: 'var(--warning-bg)', borderRadius: 10, fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 20, borderLeft: '3px solid var(--warning)' }}>
                    "{r.notes}"
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
                  <div>
                      {r.installment && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} /> DUES: {fmtDate(r.installment.due_date)}
                        </div>
                      )}
                  </div>
                  {filter === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn--sm" style={{ color: 'var(--danger)', border: 'none', fontWeight: 700, background: 'transparent' }} onClick={() => setRejectModal(r)}>
                        REJECT
                      </button>
                      <button className="btn btn--primary" style={{ padding: '8px 24px', borderRadius: 10, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)', fontWeight: 800 }} onClick={() => setApproveModal(r)}>
                        APPROVE
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 1 }}>Verified On</div>
                       <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{new Date(r.updated_at).toLocaleDateString(undefined, { day:'2-digit', month: 'short', year:'numeric' })}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {approveModal && (
        <ActionModal 
          voucher={approveModal} 
          type="APPROVE" 
          onConfirm={() => handleApprove(approveModal.id)} 
          onClose={() => setApproveModal(null)} 
        />
      )}

      {rejectModal && (
        <ActionModal 
          voucher={rejectModal} 
          type="REJECT" 
          onConfirm={() => handleReject(rejectModal.id)} 
          onClose={() => setRejectModal(null)} 
        />
      )}
    </div>
  )
}

function ActionModal({ voucher, type, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isApprove = type === 'APPROVE'

  const handle = async () => {
    setLoading(true); setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${type.toLowerCase()} voucher.`)
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ 
          background: isApprove ? 'var(--success-bg)' : 'var(--danger-bg)', 
          color: isApprove ? 'var(--success)' : 'var(--danger)' 
        }}>
          <h3>{isApprove ? 'Confirm Approval' : 'Confirm Rejection'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {isApprove 
              ? `You are about to approve the collection of ₹${fmtCurrency(voucher.amount)} from ${voucher.borrower?.name}. This will mark the installment as PAID.`
              : `Are you sure you want to reject this recovery voucher from ${voucher.borrower?.name}?`}
          </p>
          
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>BORROWER:</span>
              <strong>{voucher.borrower?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>AMOUNT:</span>
              <strong style={{ color: 'var(--primary)', fontSize: 14 }}>₹{fmtCurrency(voucher.amount)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>COLLECTED BY:</span>
              <strong>{voucher.staff?.name}</strong>
            </div>
          </div>

          {error && <div className="alert alert--error" style={{ marginTop: 16 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn--outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button 
            className={`btn ${isApprove ? 'btn--primary' : 'btn--danger'}`} 
            onClick={handle} 
            disabled={loading}
          >
            {loading ? 'Processing...' : isApprove ? 'Confirm Approval' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}
