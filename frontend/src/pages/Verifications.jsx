import { useEffect, useState } from 'react'
import api from '../api'
import { Search, Eye, X, CheckSquare, MessageCircle, CheckCircle, XCircle } from 'lucide-react'
import LiveSearchInput from '../components/LiveSearchInput'
import { fmtDate, fmtCurrency } from '../utils'

const statusBadge = s => {
  if (s === 'VERIFYING') return <span className="badge badge--warning">Verification Pending</span>
  if (s === 'ACTIVE')    return <span className="badge badge--primary">Active</span>
  if (s === 'REJECTED')  return <span className="badge badge--danger">Rejected</span>
  if (s === 'CLOSED')    return <span className="badge badge--success">Closed</span>
  return <span className="badge badge--gray">{s}</span>
}

const fmt = fmtCurrency

export default function Verifications() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  const load = () => {
    setLoading(true)
    api.get('/loans', { params: { status: 'VERIFYING', search } })
      .then(r => setList(r.data?.data ?? r.data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [search])

  const approve = async (loan) => {
    if (!confirm(`Are you sure you want to APPROVE the application for ${loan.borrower?.name}?`)) return
    try {
      await api.patch(`/loans/${loan.id}/approve`, { send_whatsapp: true })
      alert('Application Approved!')
      load()
    } catch (ex) {
      alert(ex.response?.data?.message || 'Approval failed.')
    }
  }

  const reject = async (loan) => {
    if (!confirm(`Are you sure you want to REJECT the application for ${loan.borrower?.name}?`)) return
    try {
      await api.patch(`/loans/${loan.id}/reject`)
      alert('Application Rejected.')
      load()
    } catch (ex) {
      alert(ex.response?.data?.message || 'Rejection failed.')
    }
  }

  const filtered = list.filter(l =>
    (l.borrower?.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (l.borrower?.vehicle?.vehicle_no||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <h1>Applications</h1>
        <p>Review and verify loan applications submitted by staff</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{padding:'20px 24px', display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--primary-bg)'}}>
          <div style={{position:'relative',flex:1,maxWidth:320}}>
            <Search size={18} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',opacity:0.4}}/>
            <input 
              type="text" 
              className="form-control" 
              style={{paddingLeft:38}} 
              placeholder="Filter pending by name or vehicle..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? <p className="loading-text">Loading applications…</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Borrower</th>
                  <th>Vehicle No.</th>
                  <th>Start Date</th>
                  <th>Amount</th>
                  <th>Installments</th>
                  <th style={{ textAlign: 'center' }}>Staff</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="loading-text">No pending applications found.</td></tr>
                ) : filtered.map((l, i) => (
                  <tr key={l.id}>
                    <td>{i+1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{l.borrower?.name||'—'}</div>
                      <div style={{ fontSize: 10, opacity: 0.6 }}>Folio: {l.borrower?.folio_prefix}-{l.borrower?.folio_no}</div>
                    </td>
                    <td className="td-mono">{l.borrower?.vehicle?.vehicle_no||'—'}</td>
                    <td>{fmtDate(l.agreement_date)}</td>
                    <td>₹{fmt(l.gross_amount)}</td>
                     <td>
                       <div style={{ fontWeight: 600 }}>{l.total_installments} × ₹{fmt(l.installment_amount)}</div>
                       <div style={{ fontSize: 10, opacity: 0.5 }}>P: ₹{fmt(l.installment_rate)} | I: ₹{fmt(l.interest_per_month * (l.interval || 1))}</div>
                     </td>
                    <td style={{ textAlign: 'center', fontSize: 11 }}>{l.borrower?.recovery_man?.name || 'Staff'}</td>
                    <td>{statusBadge(l.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn--success btn--sm" onClick={() => approve(l)}>
                          <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => reject(l)}>
                          <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                        </button>
                        <a href={`/loans/${l.id}`} className="btn btn--ghost btn--sm" title="Details">
                          <Eye size={14}/>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
