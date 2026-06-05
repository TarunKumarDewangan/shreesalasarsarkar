import React, { useState, useEffect } from 'react'
import api from '../api'
import { fmtCurrency, fmtDate } from '../utils'
import { 
  FileUp, Search, Clock, Trash2, ChevronDown, ChevronRight, 
  CheckCircle, AlertCircle, Filter, Download, ExternalLink, X, Database
} from 'lucide-react'
import { Link } from 'react-router-dom'
import BacklogProfile from './BacklogProfile'

export default function CombineViewBacklog() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('') // P, F, S or empty
  const [sourceFilter, setSourceFilter] = useState('ALL') // ALL, New, Old
  const [expanded, setExpanded] = useState({}) // { accountId: true }

  // Modal profile state for old accounts
  const [selectedProfileId, setSelectedProfileId] = useState(null)

  const load = (p = page) => {
    setLoading(true)
    api.get('/combine-backlog', { 
      params: { 
        page: p, 
        search, 
        type, 
        source_filter: sourceFilter,
        per_page: 15
      } 
    })
      .then(r => {
        setList(r.data.data)
        setLastPage(r.data.last_page)
        setTotalRecords(r.data.total)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load(1)
    }, 400) // 400ms debounce
    return () => clearTimeout(timer)
  }, [type, sourceFilter, search])

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const getFolioDisplay = (item) => {
    return `${item.cbcode}-${item.fno}`
  }

  return (
    <div>
      <style>{`
        .source-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .source-badge--new {
          background-color: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        .source-badge--old {
          background-color: #fef3c7;
          color: #d97706;
          border: 1px solid #fde68a;
        }
      `}</style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Combine View Backlog</h1>
          <p>Combined dashboard of active borrowers and legacy backlog records</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by customer name, folio, mobile or vehicle no..." 
            style={{ paddingLeft: 40 }}
            value={search}
            onChange={e => {
              setSearch(e.target.value)
            }}
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-control" style={{ width: 160 }} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
              <option value="ALL">All Sources</option>
              <option value="New">New (Active)</option>
              <option value="Old">Old (Backlog)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-control" style={{ width: 140 }} value={type} onChange={e => setType(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="P">Pendings</option>
              <option value="S">Seized</option>
              <option value="F">Finals/Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        {loading ? <p className="loading-text">Loading combined backlog data...</p> : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th style={{ width: 80 }}>Source</th>
                  <th style={{ width: 50 }}>SNO</th>
                  <th>Status</th>
                  <th>Folio</th>
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
                  <tr>
                    <td colSpan="15" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No combined records found.
                    </td>
                  </tr>
                ) : list.map(acc => (
                  <React.Fragment key={acc.id}>
                    <tr>
                      <td>
                        <button className="btn btn--ghost btn--xs" onClick={() => toggleExpand(acc.id)}>
                          {expanded[acc.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td>
                        <span className={`source-badge source-badge--${acc.source.toLowerCase()}`}>
                          {acc.source}
                        </span>
                      </td>
                      <td className="td-mono" style={{ color: 'var(--text-muted)' }}>{acc.sno || '—'}</td>
                      <td>
                        <span className={`badge badge--${acc.type === 'P' ? 'primary' : acc.type === 'S' ? 'warning' : 'success'}`}>
                          {acc.type === 'P' ? 'PENDING' : acc.type === 'S' ? 'SEIZED' : 'FINAL'}
                        </span>
                      </td>
                      <td className="td-mono">{getFolioDisplay(acc)}</td>
                      <td>
                        {acc.source === 'New' ? (
                          <Link to={`/borrowers/${acc.borrower_id}/ledger`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <strong>{acc.customer_name}</strong>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.father_name}</div>
                          </Link>
                        ) : (
                          <span 
                            onClick={() => setSelectedProfileId(acc.id.replace('old-', ''))} 
                            style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                          >
                            <strong>{acc.customer_name}</strong>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.father_name}</div>
                          </span>
                        )}
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
                        {acc.source === 'New' ? (
                          <Link to={`/borrowers/${acc.borrower_id}/ledger`} className="btn btn--outline btn--xs">
                            <ExternalLink size={12} style={{ marginRight: 4 }} /> Ledger
                          </Link>
                        ) : (
                          <button 
                            className="btn btn--outline btn--xs"
                            onClick={() => setSelectedProfileId(acc.id.replace('old-', ''))}
                          >
                            <ExternalLink size={12} style={{ marginRight: 4 }} /> Profile
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded[acc.id] && (
                      <tr className="expanded-row" style={{ background: 'var(--primary-bg-light)', borderBottom: '2px solid var(--primary-bg)' }}>
                        <td colSpan={15} style={{ padding: '0 20px 20px 60px' }}>
                          <div style={{ marginTop: 10 }}>
                            <h4 style={{ fontSize: 13, marginBottom: 10, color: 'var(--primary)' }}>Installment History</h4>
                            {acc.installments?.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No installments found for this account.</p> : (
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
                                  {acc.installments?.map((ins, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
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
        {lastPage > 1 && (
          <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showing {list.length} of {totalRecords || ''} records</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--outline btn--sm" disabled={page === 1} onClick={() => load(page - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {page} of {lastPage}</span>
              <button className="btn btn--outline btn--sm" disabled={page === lastPage} onClick={() => load(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Detail Modal for old accounts */}
      {selectedProfileId && (
        <div className="modal-backdrop" style={{ padding: '20px', zIndex: 10000 }} onClick={() => setSelectedProfileId(null)}>
          <div className="modal animate-in" style={{ 
            maxWidth: '96vw', 
            width: '96vw', 
            maxHeight: '96vh', 
            height: '96vh', 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            border: '1px solid var(--border)'
          }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'white', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>Account Statement & Ledger</h2>
              <button className="modal-close" onClick={() => setSelectedProfileId(null)} style={{ background: '#f1f5f9', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ flex: 1, padding: 0, overflowY: 'auto', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
              <BacklogProfile profileId={selectedProfileId} onBack={() => setSelectedProfileId(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
