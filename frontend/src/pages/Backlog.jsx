import React, { useState, useEffect } from 'react'
import api from '../api'
import { 
  FileUp, Search, Clock, Trash2, ChevronDown, ChevronRight, 
  CheckCircle, AlertCircle, Filter, Download, ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { fmtCurrency, fmtDate } from '../utils'

export default function Backlog() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('') // P, F or empty
  const [expanded, setExpanded] = useState({}) // { accountId: true }
  const [uploading, setUploading] = useState(null) // 'accounts' or 'installments'

  const load = () => {
    setLoading(true)
    api.get('/backlog', { params: { page, search, type } })
      .then(r => {
        setList(r.data.data)
        setLastPage(r.data.last_page)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [page, type])

  const handleUpload = async (e, mode, uploadType) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', uploadType) // 'P' or 'F'

    setUploading(mode)
    try {
      const endpoint = mode === 'accounts' ? '/backlog/upload-accounts' : '/backlog/upload-installments'
      await api.post(endpoint, formData)
      alert(`${mode.charAt(0).toUpperCase() + mode.slice(1)} imported successfully!`)
      load()
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setUploading(null)
      e.target.value = '' // Reset input
    }
  }

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const clearBacklog = async () => {
    if (!window.confirm('Are you sure you want to clear ALL backlog data? This cannot be undone.')) return
    
    try {
      setLoading(true)
      const res = await api.delete('/backlog/clear')
      alert(res.data.message || 'Backlog cleared successfully!')
      setPage(1)
      load()
    } catch (err) {
      alert('Failed to clear backlog: ' + (err.response?.data?.message || err.message))
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Backlog Management</h1>
          <p>Import and view legacy Excel records</p>
        </div>
        <button className="btn btn--danger btn--sm" onClick={clearBacklog}>
          <Trash2 size={16} /> Clear Backlog
        </button>
      </div>

      {/* Upload Controls */}
      <div className="grid grid--2" style={{ marginBottom: 24, gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Import Pendings Data
          </h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer', flex: 1 }}>
              <FileUp size={14} /> {uploading === 'accounts-P' ? 'Uploading...' : 'Upload P_ACCOUNT'}
              <input type="file" hidden onChange={e => handleUpload(e, 'accounts', 'P')} disabled={!!uploading} />
            </label>
            <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer', flex: 1 }}>
              <FileUp size={14} /> {uploading === 'installments-P' ? 'Uploading...' : 'Upload P_INSTALLMENT'}
              <input type="file" hidden onChange={e => handleUpload(e, 'installments', 'P')} disabled={!!uploading} />
            </label>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Import Finals Data
          </h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer', flex: 1 }}>
              <FileUp size={14} /> {uploading === 'accounts-F' ? 'Uploading...' : 'Upload F_ACCOUNT'}
              <input type="file" hidden onChange={e => handleUpload(e, 'accounts', 'F')} disabled={!!uploading} />
            </label>
            <label className="btn btn--outline btn--sm" style={{ cursor: 'pointer', flex: 1 }}>
              <FileUp size={14} /> {uploading === 'installments-F' ? 'Uploading...' : 'Upload F_INSTALLMENT'}
              <input type="file" hidden onChange={e => handleUpload(e, 'installments', 'F')} disabled={!!uploading} />
            </label>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name or FNO..." 
            style={{ paddingLeft: 40 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
          />
        </div>
        <select className="form-control" style={{ width: 150 }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="P">Pendings</option>
          <option value="F">Finals</option>
        </select>
        <button className="btn btn--primary" onClick={load}>Search</button>
      </div>

      {/* Data Table */}
      <div className="card">
        {loading ? <p className="loading-text">Loading backlog data...</p> : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th style={{ width: 60 }}>SNO</th>
                  <th>Type</th>
                  <th>FNO</th>
                  <th>Customer Name</th>
                  <th>Fin. Amt</th>
                  <th>Agreement</th>
                  <th>HP Amt</th>
                  <th>Interest</th>
                  <th>Total</th>
                  <th>EMI / Rate</th>
                  <th>Months</th>
                  <th>Installments</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No backlog records found. Upload Excel files to begin.</td></tr>
                ) : list.map(acc => (
                  <React.Fragment key={acc.id}>
                    <tr>
                      <td>
                        <button className="btn btn--ghost btn--xs" onClick={() => toggleExpand(acc.id)}>
                          {expanded[acc.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{acc.sno}</td>
                      <td><span className={`badge badge--${acc.type === 'P' ? 'primary' : 'success'}`}>{acc.type === 'P' ? 'PENDING' : 'FINAL'}</span></td>
                      <td className="td-mono">{acc.fno}</td>
                      <td>
                        <Link to={`/backlog/${acc.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <strong>{acc.customer_name}</strong>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.father_name}</div>
                        </Link>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{fmtCurrency(acc.finance_amount)}</td>
                      <td style={{ color: '#64748b' }}>₹{fmtCurrency(acc.agreement_amount)}</td>
                      <td style={{ color: '#64748b' }}>₹{fmtCurrency(acc.hp_amount)}</td>
                      <td style={{ color: '#64748b' }}>₹{fmtCurrency(acc.interest_amount)}</td>
                      <td style={{ fontWeight: 700 }}>₹{fmtCurrency(acc.total_amount)}</td>
                      <td>
                        <div style={{ fontWeight: 800 }}>₹{fmtCurrency(acc.installment_amount)}</div>
                        <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600 }}>{acc.interest_rate}% p.a.</div>
                      </td>
                      <td>{acc.total_months}</td>
                      <td>{acc.installments_count || 0} Records</td>
                      <td>
                        <Link to={`/backlog/${acc.id}`} className="btn btn--outline btn--xs">
                          <ExternalLink size={12} style={{ marginRight: 4 }} /> Profile
                        </Link>
                      </td>
                    </tr>
                    {expanded[acc.id] && (
                      <tr className="expanded-row" style={{ background: 'var(--primary-bg-light)', borderBottom: '2px solid var(--primary-bg)' }}>
                        <td colSpan={14} style={{ padding: '0 20px 20px 60px' }}>
                          <div style={{ marginTop: 10 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 10, color: 'var(--primary)' }}>Installment History</h4>
                            {acc.installments?.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No installments imported for this account.</p> : (
                              <table className="table--nested" style={{ width: '100%', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--primary-bg)' }}>
                                    <th style={{ padding: '8px 4px' }}>No.</th>
                                    <th>Due Date</th>
                                    <th>Paid Date</th>
                                    <th>Amount</th>
                                    <th>Paid</th>
                                    <th>Balance</th>
                                    <th>Mode</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {acc.installments?.map(ins => (
                                    <tr key={ins.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                      <td style={{ padding: '8px 4px' }}>{ins.installment_no}</td>
                                      <td>{fmtDate(ins.due_date)}</td>
                                      <td>{fmtDate(ins.payment_date) || '—'}</td>
                                      <td>₹{fmtCurrency(ins.installment_amount)}</td>
                                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{fmtCurrency(ins.paid_amount)}</td>
                                      <td style={{ color: 'var(--danger)' }}>₹{fmtCurrency(ins.balance_amount)}</td>
                                      <td>{ins.mode || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn btn--outline btn--sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {page} of {lastPage}</span>
          <button className="btn btn--outline btn--sm" disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  )
}
