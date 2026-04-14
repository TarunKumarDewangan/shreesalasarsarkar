import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Search, Eye, X, CheckCircle, RotateCcw, CheckSquare, Calendar, Filter, MessageCircle, Trash2 } from 'lucide-react'
import LiveSearchInput from '../components/LiveSearchInput'
import PayModal from '../components/PayModal'
import { fmtDate, fmtCurrency } from '../utils'

const statusBadge = s => {
  if (s === 'VERIFYING') return <span className="badge badge--warning" style={{ fontSize: 10 }}>Pending Verification</span>
  if (s === 'REJECTED')  return <span className="badge badge--danger" style={{ fontSize: 10 }}>Rejected</span>
  if (s === 'ACTIVE')    return <span className="badge badge--primary" style={{ fontSize: 10 }}>Active</span>
  if (s === 'CLOSED')    return <span className="badge badge--success" style={{ fontSize: 10 }}>Closed</span>
  if (s === 'SEIZED')    return <span className="badge badge--warning" style={{ fontSize: 10 }}>Seized</span>
  return <span className="badge badge--gray">{s}</span>
}

const fmt = fmtCurrency

/* ── Assignment Modal ─────────────────────────────────────────────── */
function AssignmentModal({ borrower, staff, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      recovery_man_id: borrower.recovery_man_id || '',
      collection_date: borrower.collection_date || today
    }
  })
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/borrowers/${borrower.id}`, form)
      onSaved()
    } catch (ex) {
      alert('Failed to save assignment.')
    } finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Recovery Executive</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Recovery Executive</label>
              <select className="form-control" value={form.recovery_man_id} onChange={set('recovery_man_id')} required>
                <option value="">-- Select Agent --</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Collection Date</label>
              <input type="date" className="form-control" value={form.collection_date} onChange={set('collection_date')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Installment Panel ─────────────────────────────────────────────── */
function InstallmentPanel({ loan, onClose }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // installment to pay

  const load = () => {
    setLoading(true)
    api.get(`/loans/${loan.id}/installments`).then(r => setItems(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [loan.id])

  const markPaid = async (ins, data) => {
    await api.patch(`/installments/${ins.id}/pay`, data)
    setModal(null); load()
  }
  const markUnpay = async ins => {
    if (!confirm('Mark this installment as PENDING?')) return
    await api.patch(`/installments/${ins.id}/unpay`)
    load()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:980}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{loan.borrower?.name}</h3>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
              ₹{fmt(loan.gross_amount)} @ {loan.interest_rate}% — {items.length} installments
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div style={{padding:'0 0 4px'}}>
          {loading ? <p className="loading-text">Loading…</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Receipt No</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>EMI</th>
                    <th>Balance</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Paid On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ins, i) => (
                    <tr key={ins.id} className={`ins-row${ins.status==='PAID' ? ' ins-row--paid' : ''}`}>
                      <td>{i+1}</td>
                      <td>{fmtDate(ins.due_date)}</td>
                      <td className="td-mono" style={{ fontSize: 11 }}>{ins.receipt_no || '—'}</td>
                      <td>₹{fmt(ins.principal_amount)}</td>
                      <td>₹{fmt(ins.interest_amount)}</td>
                      <td style={{ fontWeight: 600 }}>₹{fmt(ins.amount_due)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>₹{fmt(ins.balance)}</td>
                      <td>{ins.method || '—'}</td>
                      <td>
                        {ins.status === 'PAID'
                          ? <span className="badge badge--success">Paid</span>
                          : ins.status === 'OVERDUE'
                          ? <span className="badge badge--danger">Overdue</span>
                          : <span className="badge badge--warning">Pending</span>
                        }
                      </td>
                      <td>{fmtDate(ins.paid_date)}</td>
                      <td>
                        {ins.status !== 'PAID'
                          ? <button className="btn btn--success btn--sm" onClick={() => setModal(ins)}>
                              <CheckCircle size={12}/> Pay
                            </button>
                          : <button className="btn btn--outline btn--sm" onClick={() => markUnpay(ins)}>
                              <RotateCcw size={12}/> Undo
                            </button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {modal && <PayModal installment={modal} onPay={data => markPaid(modal, data)} onClose={() => setModal(null)} />}
    </div>
  )
}

/* ── Notification Confirmation Modal ─────────────────────────────── */
function NotificationModal({ loan, onClose, onConfirm }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const handleSend = async () => {
    setSending(true); setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to send WhatsApp notification.')
    } finally { setSending(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#25D366', color: '#fff', padding: 6, borderRadius: 8, display: 'flex' }}>
              <MessageCircle size={18}/>
            </div>
            <h3>Send WhatsApp</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Confirm sending a WhatsApp notification to <strong>{loan.borrower?.name}</strong> at <strong>{loan.borrower?.mobile}</strong>?
          </p>
          <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Folio:</span>
              <span className="td-mono">{loan.borrower?.folio_prefix}-{loan.borrower?.folio_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Amount:</span>
              <strong>₹{fmtCurrency(loan.gross_amount)}</strong>
            </div>
          </div>
          {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--success" onClick={handleSend} disabled={sending} style={{ background: '#25D366', borderColor: '#25D366' }}>
            {sending ? 'Sending...' : 'Send WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Deletion Confirmation Modal ────────────────────────────────────── */
function DeleteLoanModal({ loan, onClose, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setConfirming(true); setError(null)
    try {
      await api.delete(`/loans/${loan.id}`)
      onDeleted()
    } catch (ex) {
      setError('Failed to delete this loan record.')
    } finally { setConfirming(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <h3>Confirm Record Deletion</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            You are about to permanently delete this loan case. To avoid mistakes, please verify the following details:
          </p>
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>FOLIO NO:</span>
              <span className="td-mono" style={{ fontWeight: 800 }}>{loan.borrower?.folio_prefix}-{loan.borrower?.folio_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>BORROWER:</span>
              <span style={{ fontWeight: 700 }}>{loan.borrower?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>MOBILE:</span>
              <span style={{ fontWeight: 700 }}>{loan.borrower?.mobile || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>VEHICLE:</span>
              <span className="td-mono">{loan.borrower?.vehicle?.vehicle_no || 'N/A'}</span>
            </div>
          </div>
          {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}
          <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginTop: 12 }}>
            ⚠️ ALL linked installments, recovery records, and the borrower case entry will be removed. Personal details in "Personal Details" page will remain safe.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={confirming}>
            {confirming ? 'Deleting...' : 'Confirm Delete Case'}
          </button>
        </div>
      </div>
    </div>
  )
}


/* ── Main Loans Page ───────────────────────────────────────────────── */
export default function Loans() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [filters, setFilters]   = useState({ start_date: '', end_date: '', exact_date: '', min_pending: '', recovery_man_id: '', status: '' })
  const [staff, setStaff]       = useState([])
  const [assignModal, setAssignModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [notifyModal, setNotifyModal] = useState(null)

  const loadStaff = () => api.get('/recovery-men').then(r => setStaff(r.data))

  const load = () => {
    setLoading(true)
    api.get('/loans', { params: { ...filters, search } })
      .then(r => setList(r.data?.data ?? r.data))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filters]) // reload on filter change
  useEffect(() => { loadStaff() }, [])

  const filtered = list.filter(l =>
    (l.borrower?.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.vehicle_number||'').toLowerCase().includes(search.toLowerCase())
  )
  
  const notifyLoan = async (loan) => {
    try {
      await api.post(`/loans/${loan.id}/send-notification`)
      alert('Notification sent successfully!')
    } catch (ex) {
      throw ex // Let modal handle error
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Loans</h1>
        <p>All finance records with installment tracking</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{padding:'16px 20px 16px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--primary-bg)'}}>
          <div style={{position:'relative',flex:1,maxWidth:320}}>
            <LiveSearchInput 
              placeholder="Search by name, vehicle no or mobile..." 
              className="search-bar-primary"
              onSearch={setSearch}
              onSelect={(res) => {
                if (res.loan_id) {
                  setLoading(true)
                  api.get(`/loans/${res.loan_id}`).then(r => {
                    setList([r.data])
                    setSelected(r.data)
                  }).finally(() => setLoading(false))
                }
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>EXACT DATE</label>
              <input 
                type="date" 
                className="form-control form-control--sm" 
                value={filters.exact_date} 
                onChange={e => setFilters(f => ({ ...f, exact_date: e.target.value, start_date: '', end_date: '' }))} 
              />
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--primary-bg)' }} />

            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>FROM DATE</label>
              <input 
                type="date" 
                className="form-control form-control--sm" 
                value={filters.start_date} 
                onChange={e => setFilters(f => ({ ...f, start_date: e.target.value, exact_date: '' }))} 
              />
            </div>
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>TO DATE</label>
              <input 
                type="date" 
                className="form-control form-control--sm" 
                value={filters.end_date} 
                onChange={e => setFilters(f => ({ ...f, end_date: e.target.value, exact_date: '' }))} 
              />
            </div>

            {(filters.start_date || filters.end_date || filters.exact_date) && (
              <button 
                className="btn btn--ghost btn--sm" 
                style={{ marginTop: 18 }} 
                onClick={() => setFilters({ start_date: '', end_date: '', exact_date: '' })}
              >
                <X size={14} /> Clear
              </button>
            )}

            <div style={{ width: 1, height: 24, background: 'var(--primary-bg)' }} />

            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>PENDING DUE</label>
              <select 
                className="form-control form-control--sm" 
                value={filters.min_pending} 
                onChange={e => setFilters(f => ({ ...f, min_pending: e.target.value }))}
                style={{ width: 100 }}
              >
                <option value="">All Loans</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>{n}+ Pending</option>
                ))}
              </select>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--primary-bg)' }} />

            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>RECOVERY AGENT</label>
              <select 
                className="form-control form-control--sm" 
                value={filters.recovery_man_id} 
                onChange={e => setFilters(f => ({ ...f, recovery_man_id: e.target.value }))}
                style={{ width: 130 }}
              >
                <option value="">All Agents</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>STATUS</label>
              <select 
                className="form-control form-control--sm" 
                value={filters.status} 
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                style={{ width: 130 }}
              >
                <option value="">All Statuses</option>
                <option value="VERIFYING">Pending Verification</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="REJECTED">Rejected</option>
                <option value="SEIZED">Seized</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <p className="loading-text">Loading…</p> : (
          <div className="table-wrap" style={{marginTop:16}}>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Folio</th>
                  <th>Borrower</th>
                  <th>Vehicle No.</th>
                  <th>Gross Amt</th>
                  <th>Rate</th>
                  <th>Installments</th>
                  <th style={{ textAlign: 'center' }}>Executive</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="loading-text">No loans found.</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={l.id}>
                    <td>{i+1}</td>
                    <td className="td-mono" data-label="Folio" style={{ fontSize: 11, fontWeight: 700 }}>
                      {l.borrower?.folio_prefix}-{l.borrower?.folio_no}
                    </td>
                    <td data-label="Borrower"><strong>{l.borrower?.name||'—'}</strong></td>
                    <td className="td-mono" data-label="Vehicle">{l.borrower?.vehicle?.vehicle_no||'—'}</td>
                    <td data-label="Amount">₹{fmt(l.gross_amount)}</td>
                    <td data-label="Rate">{l.interest_rate}%</td>
                    <td data-label="Emi">
                      {l.interval > 1 
                        ? `${l.total_installments} installments × ₹${fmt(l.installment_amount)}`
                        : `${l.total_months} mo × ₹${fmt(l.installment_rate)}`
                      }
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 11, fontWeight: 600 }} data-label="Executive">{l.borrower?.recovery_man?.name || '—'}</td>
                    <td data-label="Status">{statusBadge(l.status)}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn--outline btn--sm btn--xs" onClick={() => setSelected(l)} title="Quick Installments" style={{ padding: '4px 8px' }}>
                          <CheckSquare size={12}/> EMI
                        </button>
                        <button className="btn btn--outline btn--sm btn--xs" onClick={() => setAssignModal(l.borrower)} title="Assign Recovery" style={{ color: 'var(--primary)', padding: '4px 8px' }}>
                          <Calendar size={12}/> ASSIGN
                        </button>
                        <button className="btn btn--outline btn--sm btn--xs" onClick={() => setNotifyModal(l)} title="Send WhatsApp Notification" style={{ color: '#25D366', padding: '4px 8px' }}>
                          <MessageCircle size={12}/> WHATSAPP
                        </button>
                        <Link to={`/loans/${l.id}`} className="btn btn--outline btn--sm btn--xs" title="View Full Detail" style={{ padding: '4px 8px' }}>
                          <Eye size={12}/> VIEW
                        </Link>
                        <button className="btn btn--danger btn--sm btn--xs" onClick={() => setDeleteModal(l)} title="Delete Case" style={{ padding: '4px 8px', background: 'none', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                          <Trash2 size={12}/> DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <InstallmentPanel loan={selected} onClose={() => setSelected(null)} />
      )}

      {assignModal && (
        <AssignmentModal
          borrower={assignModal}
          staff={staff}
          onClose={() => setAssignModal(null)}
          onSaved={() => { setAssignModal(null); load() }}
        />
      )}

      {deleteModal && (
        <DeleteLoanModal
          loan={deleteModal}
          onClose={() => setDeleteModal(null)}
          onDeleted={() => { setDeleteModal(null); load() }}
        />
      )}

      {notifyModal && (
        <NotificationModal
          loan={notifyModal}
          onConfirm={() => notifyLoan(notifyModal)}
          onClose={() => setNotifyModal(null)}
        />
      )}
    </div>
  )
}
