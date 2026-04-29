import { useEffect, useState, useMemo } from 'react'
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

import AssignmentModal from '../components/loans/AssignmentModal'
import InstallmentPanel from '../components/loans/InstallmentPanel'
import NotificationModal from '../components/loans/NotificationModal'
import DeleteLoanModal from '../components/loans/DeleteLoanModal'

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

  const filtered = useMemo(() => {
    return list.filter(l =>
      (l.borrower?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.borrower?.vehicle?.vehicle_no || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.borrower?.mobile || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [list, search])
  
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
