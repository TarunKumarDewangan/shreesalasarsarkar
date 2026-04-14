import { useEffect, useState } from 'react'
import api from '../api'
import { Search, RotateCcw, X, FileText, User, Phone, MapPin, CreditCard, Loader2, Sparkles, History, ChevronRight, Command } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import PremiumSearch from '../components/PremiumSearch'

export default function Customers() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [detLoading, setDetLoading] = useState(false)

  const load = (p = 1, q = '') => {
    setLoading(true)
    api.get('/customers', { params: { page: p, search: q } })
      .then(r => {
        setList(r.data.data ?? r.data)
        setMeta(r.data.meta ?? r.data)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }

  const [showSync, setShowSync] = useState(false)

  const performSync = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/customers/sync-all')
      return res.data.count
    } catch (ex) {
      throw ex
    } finally { setSyncing(false) }
  }

  useEffect(() => { load(1, search) }, [])

  useEffect(() => {
    if (selected) {
      setDetLoading(true)
      api.get(`/customers/${selected.id}`)
        .then(r => setDetails(r.data))
        .finally(() => setDetLoading(false))
    } else {
      setDetails(null)
    }
  }, [selected?.id])

  const handleSearch = e => {
    const q = e.target.value
    setSearch(q)
    load(1, q)
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Personal Details</h1>
          <p>Persistent customer management & loan verification registry</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowSync(true)} disabled={syncing}>
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
          {syncing ? 'Syncing...' : 'Sync Legacy Data'}
        </button>
      </div>

      <div className="borrowers-layout">
        <div className="borrowers-main">
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <PremiumSearch 
              placeholder="Search by name, mobile, aadhar..." 
              onSearch={(q) => {
                setSearch(q)
                load(1, q)
              }}
              onSelect={(item) => setSelected(item)}
              results={list.slice(0, 5).map(c => ({ ...c, type: 'CUSTOMER' }))}
              loading={loading}
            />
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', opacity: 0.5 }} />
              <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Fetching customer records...</p>
            </div>
          ) : (
            <div className="customer-grid">
              {list.length === 0 ? (
                <div className="card" style={{ padding: 60, textAlign: 'center', gridColumn: 'span 2' }}>
                  <History size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                  <h3>No Customer Records Found</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '8px auto' }}>
                    Records might not be synced yet. Use the "Sync Legacy Data" button to link your existing borrowers.
                  </p>
                </div>
              ) : (
                <div className="table-wrap card">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>CUSTOMER PROFILE</th>
                        <th>AADHAR / IDENTITY</th>
                        <th>ACCOUNTS</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(c => (
                        <tr key={c.id} className={selected?.id === c.id ? 'row-selected' : ''} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>{c.name[0]}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                                <div style={{ fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Phone size={10} /> {c.mobile || 'NO MOBILE'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.aadhar || '—'}</div>
                            <div style={{ fontSize: 10, opacity: 0.5 }}>IDENTIFIER</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="badge badge--primary-bg" style={{ padding: '4px 10px', fontSize: 12 }}>{c.borrowers_count}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.5 }}>ACTIVE</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn--outline btn--sm" style={{ border: 'none', background: 'var(--surface)', fontWeight: 700 }}>
                              VIEW HISTORY <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {meta && meta.last_page > 1 && (
                    <div className="pagination" style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
                      <button className="btn btn--outline btn--sm" disabled={page<=1} onClick={() => load(page-1, search)}>← Prev</button>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Page {page} / {meta.last_page}</span>
                      <button className="btn btn--outline btn--sm" disabled={page>=meta.last_page} onClick={() => load(page+1, search)}>Next →</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {selected && (
          <div className="card side-panel animate-in" style={{ flex: '1 1 35%', position: 'sticky', top: 20, minWidth: 320, maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ background: 'var(--primary)', color: '#fff', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <User size={20} />
                  <span style={{ fontWeight: 700, fontSize: 16 }}>CUSTOMER PROFILE</span>
                </div>
                <button className="btn btn--ghost btn--sm" style={{ color: '#fff' }} onClick={() => setSelected(null)}><X size={18}/></button>
              </div>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', padding: 24 }}>
              <div className="view-section">
                <label style={{ fontSize: 10, letterSpacing: 1, fontWeight: 800, color: 'var(--primary)', marginBottom: 16, display: 'block' }}>PERSONAL INTELLIGENCE</label>
                <div className="view-grid" style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div className="view-item"><span>Name:</span> <strong>{selected.name}</strong></div>
                  <div className="view-item"><span>S/O:</span> {selected.father_name}</div>
                  <div className="view-item"><span>Mobile:</span> {selected.mobile}</div>
                  <div className="view-item"><span>DOB:</span> {fmtDate(selected.dob)}</div>
                  <div className="view-item"><span>Aadhar:</span> {selected.aadhar || '—'}</div>
                  <div className="view-item"><span>PAN:</span> {selected.pan || '—'}</div>
                  <div className="view-item" style={{ gridColumn: 'span 2', marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                      <MapPin size={14} style={{marginTop:2, color: 'var(--primary)'}} />
                      <span style={{ fontSize: 12, lineHeight: 1.5 }}>{selected.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="view-section" style={{ marginTop: 24 }}>
                <label style={{ fontSize: 10, letterSpacing: 1, fontWeight: 800, color: 'var(--primary)', marginBottom: 16, display: 'block' }}>LOAN ACCOUNT TIMELINE</label>
                {detLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" size={24} style={{ opacity: 0.3 }} />
                  </div>
                ) : (
                  <div className="mini-ledger" style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
                    {details?.borrowers?.length > 0 ? details.borrowers.map(b => (
                      <div key={b.id} className="card" style={{ padding: 16, border: '1px solid var(--border)', boxShadow: 'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom:12 }}>
                          <span style={{ fontWeight:800, fontSize: 13, color: 'var(--primary)' }}>FOLIO: {b.folio_prefix}-{b.folio_no}</span>
                          <span className={`badge badge--${b.loans?.[0]?.status === 'ACTIVE' ? 'success' : 'gray'}`} style={{ fontSize: 10 }}>{b.loans?.[0]?.status || 'NO LOAN'}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CreditCard size={12} /> <strong>₹{fmtCurrency(b.loans?.[0]?.finance_amount || 0)}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <History size={12} /> {fmtDate(b.loans?.[0]?.agreement_date)}
                          </div>
                          <div style={{ background: 'var(--surface)', padding: '10px 14px', borderRadius: 8, fontSize: 11, marginTop: 4, border: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: 4, fontSize: 12 }}>{b.vehicle?.vehicle_no || 'NA'}</div>
                            <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 4, opacity: 0.8 }}>
                               <div>Model: {b.vehicle?.model || '—'}</div>
                               <div>Make: {b.vehicle?.make || '—'}</div>
                               <div>Chassis: {b.vehicle?.chassis_no || '—'}</div>
                               <div>Engine: {b.vehicle?.engine_no || '—'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign:'center', padding:20, opacity:0.5, fontSize:12 }}>No historical accounts.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showSync && (
        <SyncModal 
          onConfirm={performSync} 
          onClose={() => setShowSync(false)} 
          onSuccess={() => load(1, search)}
        />
      )}
    </div>
  )
}

function SyncModal({ onConfirm, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handle = async () => {
    setLoading(true); setError(null)
    try {
      const count = await onConfirm()
      setResult(count)
      onSuccess()
    } catch (e) {
      setError(e.response?.data?.message || 'Synchronization failed. Please check your connection.')
    } finally { setLoading(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={20} />
            <h3 style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 14 }}>Legacy Data Sync Hub</h3>
          </div>
          {!loading && <button className="modal-close" onClick={onClose}><X size={18}/></button>}
        </div>
        <div className="modal-body">
          {!result ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                This intelligent process re-evaluates all existing borrowers and links them to the persistent customer registry using phone numbers and Aadhar IDs. 
              </p>
              
              <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                <div style={{ display:'flex', gap:10, alignItems: 'flex-start' }}>
                   <History size={16} style={{ color: 'var(--primary)', marginTop: 2 }} />
                   <span style={{ fontSize: 12, lineHeight: 1.5 }}>
                     <strong>Recommended:</strong> Run this if you have recently imported data or if customer verification lists look incomplete. It merges duplicate profiles automatically.
                   </span>
                </div>
              </div>

              {error && <div className="alert alert--error">{error}</div>}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
               <div style={{ width: 64, height: 64, background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Sparkles size={32} />
               </div>
               <h4 style={{ marginBottom: 8, fontSize: 18 }}>Sync Successful!</h4>
               <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                 Verified and updated <strong>{result}</strong> borrower associations.
               </p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {result ? (
            <button className="btn btn--primary btn--full" onClick={onClose}>Done</button>
          ) : (
            <>
              <button className="btn btn--outline" onClick={onClose} disabled={loading}>Cancel</button>
              <button className="btn btn--primary" onClick={handle} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                {loading ? 'Processing Registry...' : 'Start Synchronizing'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
