import { useEffect, useState } from 'react'
import api from '../api'
import { RefreshCcw, Trash2, Search, Filter, Loader2, AlertCircle, Inbox, User, Wallet, CheckCircle } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'

export default function Trash() {
  const [data, setData] = useState({ borrowers: [], loans: [], recoveries: [] })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('borrowers')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ start_date: '', end_date: '', exact_date: '' })
  const [actioning, setActioning] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/trash', { params: filters })
      setData(r.data)
    } catch (e) {
      console.error('Failed to load trash:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters])

  const restore = async (type, id) => {
    if (!confirm(`Restore this ${type.slice(0, -1)}?`)) return
    setActioning(id)
    try {
      await api.post(`/trash/${type}/${id}/restore`)
      load()
    } catch (e) {
      alert('Restore failed.')
    } finally {
      setActioning(null)
    }
  }

  const forceDelete = async (type, id) => {
    if (!confirm(`Permanently delete this ${type.slice(0, -1)}? This action CANNOT be undone.`)) return
    setActioning(id)
    try {
      await api.delete(`/trash/${type}/${id}/force`)
      load()
    } catch (e) {
      alert('Delete failed.')
    } finally {
      setActioning(null)
    }
  }

  const list = (data[tab] || []).filter(item => {
    const q = search.toLowerCase()
    return (item.name?.toLowerCase().includes(q) || 
            item.borrower?.name?.toLowerCase().includes(q) ||
            item.folio_no?.toLowerCase().includes(q) ||
            item.amount?.toString().includes(q))
  })

  return (
    <div className="trash-page animate-in">
      <div className="page-header">
        <h1>Trash Bin</h1>
        <p>Recover items deleted by mistake or permanently remove them</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tabs-header">
          {[
            { id: 'borrowers', label: 'Borrowers', icon: User },
            { id: 'loans', label: 'Finance Accounts', icon: Wallet },
            { id: 'recoveries', label: 'Payments', icon: CheckCircle },
          ].map(t => (
            <button 
              key={t.id} 
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16} />
              {t.label}
              <span className="badge badge--sm" style={{ marginLeft: 8 }}>
                {data[t.id]?.length || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="toolbar" style={{ padding: '16px 20px', borderTop: '1px solid var(--primary-bg)' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="form-control" 
              style={{ paddingLeft: 36 }}
              placeholder={`Search ${tab}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn--ghost" onClick={load}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ padding: '0 20px 16px', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--primary-bg)', margin: '0 16px 16px', borderRadius: 8 }}>
          <div className="filter-group">
            <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>DELETED ON (EXACT)</label>
            <input type="date" className="form-control form-control--sm" value={filters.exact_date} onChange={e => setFilters(f => ({ ...f, exact_date: e.target.value, start_date: '', end_date: '' }))} />
          </div>
          <div className="filter-group">
            <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>DELETED FROM</label>
            <input type="date" className="form-control form-control--sm" value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value, exact_date: '' }))} />
          </div>
          <div className="filter-group">
            <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>DELETED TO</label>
            <input type="date" className="form-control form-control--sm" value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value, exact_date: '' }))} />
          </div>
          {(filters.exact_date || filters.start_date || filters.end_date) && (
            <button className="btn btn--ghost btn--sm" style={{ marginTop: 12 }} onClick={() => setFilters({ exact_date: '', start_date: '', end_date: '' })}>
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>Loading trashed items...</p>
            </div>
          ) : list.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', opacity: 0.6 }}>
              <Inbox size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3>The Trash is Empty</h3>
              <p>No deleted {tab} found.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  {tab === 'borrowers' && (
                    <>
                      <th>FOLIO</th>
                      <th>NAME</th>
                      <th>MOBILE</th>
                      <th>DELETED AT</th>
                    </>
                  )}
                  {tab === 'loans' && (
                    <>
                      <th>BORROWER</th>
                      <th>AMOUNT</th>
                      <th>AGREEMENT</th>
                      <th>DELETED AT</th>
                    </>
                  )}
                  {tab === 'recoveries' && (
                    <>
                      <th>BORROWER</th>
                      <th>AMOUNT</th>
                      <th>DATE</th>
                      <th>DELETED AT</th>
                    </>
                  )}
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.id}>
                    {tab === 'borrowers' && (
                      <>
                        <td>{item.folio_prefix}-{item.folio_no}</td>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td>{item.mobile || '—'}</td>
                      </>
                    )}
                    {tab === 'loans' && (
                      <>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.borrower?.name}</div>
                          <div style={{ fontSize: 10, opacity: 0.6 }}>Folio: {item.borrower?.folio_prefix}-{item.borrower?.folio_no}</div>
                        </td>
                        <td>₹{fmtCurrency(item.finance_amount)}</td>
                        <td>{fmtDate(item.agreement_date)}</td>
                      </>
                    )}
                    {tab === 'recoveries' && (
                      <>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.borrower?.name}</div>
                          <div style={{ fontSize: 10, opacity: 0.6 }}>By: {item.staff?.name}</div>
                        </td>
                        <td className="text-primary" style={{ fontWeight: 700 }}>₹{fmtCurrency(item.amount)}</td>
                        <td>{fmtDate(item.collection_date)}</td>
                      </>
                    )}
                    <td>{fmtDate(item.deleted_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn--outline btn--sm" 
                          style={{ color: 'var(--success)' }}
                          onClick={() => restore(tab, item.id)}
                          disabled={actioning === item.id}
                        >
                          <RefreshCcw size={14} /> Restore
                        </button>
                        <button 
                          className="btn btn--outline btn--danger btn--sm"
                          onClick={() => forceDelete(tab, item.id)}
                          disabled={actioning === item.id}
                        >
                          <Trash2 size={14} /> Delete Forever
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="alert alert--info" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertCircle size={20} />
        <div style={{ fontSize: 13 }}>
          <strong>Pro-tip:</strong> Restoring a Borrower will also restore their vehicle and guarantor details. However, you should check related Finance Accounts and Installments separately if they were also deleted.
        </div>
      </div>

      <style>{`
        .tabs-header {
          display: flex;
          background: var(--primary-bg);
          padding: 4px;
          border-radius: 8px 8px 0 0;
          gap: 4px;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: none;
          background: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 6px;
          font-size: 13,
          font-weight: 600;
          transition: 0.2s;
        }
        .tab-btn:hover {
          background: rgba(255,255,255,0.5);
          color: var(--text);
        }
        .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .trash-page .badge--sm {
          padding: 1px 6px;
          border-radius: 10px;
          background: var(--primary-bg);
          color: var(--primary);
          font-size: 10px;
        }
        .trash-page .active .badge--sm {
          background: var(--primary);
          color: white;
        }
      `}</style>
    </div>
  )
}
