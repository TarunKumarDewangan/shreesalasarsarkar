import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Car, Calendar, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'
import api from '../api'
import { fmtDate, fmtCurrency } from '../utils'

export default function SeizedVehicles() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dates, setDates] = useState({ start: '', end: '' })
  const [unseizing, setUnseizing] = useState(null)
  const [activeStatus, setActiveStatus] = useState('SEIZED')

  const load = () => {
    setLoading(true)
    api.get('/borrowers', { 
      params: { 
        status: activeStatus,
        search: search,
        start_date: dates.start,
        end_date: dates.end
      } 
    })
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [activeStatus])

  const handleUnseize = async (loanId) => {
    if (!window.confirm("Are you sure you want to unseize this vehicle and mark the loan as ACTIVE?")) return
    setUnseizing(loanId)
    try {
      await api.put(`/loans/${loanId}`, { status: 'ACTIVE' })
      load()
    } catch (ex) {
      alert("Failed to unseize vehicle.")
    } finally {
      setUnseizing(null)
    }
  }

  return (
    <div className="seized-vehicles-page">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={`status-icon-circle ${activeStatus === 'SEIZED' ? 'bg-danger' : 'bg-success'}`} style={{ 
            width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: activeStatus === 'SEIZED' ? '#fee2e2' : '#dcfce7', color: activeStatus === 'SEIZED' ? 'var(--danger)' : 'var(--success)'
          }}>
            {activeStatus === 'SEIZED' ? <ShieldAlert size={28} /> : <CheckCircle2 size={28} />}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: activeStatus === 'SEIZED' ? 'var(--danger)' : 'var(--success)' }}>
              {activeStatus === 'SEIZED' ? 'Seized Vehicles' : 'Final Settlements'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {activeStatus === 'SEIZED' ? 'Manage and track all seized assets' : 'View loans closed after final settlement'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, background: '#f3f4f6', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          <button 
            className={`toggle-btn-lg ${activeStatus === 'SEIZED' ? 'active alert' : ''}`}
            onClick={() => setActiveStatus('SEIZED')}
          >
            Seized
          </button>
          <button 
            className={`toggle-btn-lg ${activeStatus === 'FINAL' ? 'active success' : ''}`}
            onClick={() => setActiveStatus('FINAL')}
          >
            Final
          </button>
        </div>

      <div className="card shadow-sm" style={{ padding: '16px 20px', marginBottom: 24, background: '#f8fafc' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
            <label className="form-label--xs">Search Query</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control form-control--sm" 
                style={{ paddingLeft: 32 }} 
                placeholder="Name, mobile, vehicle, folio..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && load()} 
              />
            </div>
          </div>

          <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0 }}>
            <label className="form-label--xs">Seizure Period (Date)</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" className="form-control form-control--sm" value={dates.start} onChange={e => setDates(d => ({...d, start: e.target.value}))} />
              <span style={{ fontSize: 12, opacity: 0.5 }}>to</span>
              <input type="date" className="form-control form-control--sm" value={dates.end} onChange={e => setDates(d => ({...d, end: e.target.value}))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary btn--sm" style={{ height: 36, padding: '0 20px' }} onClick={load}>Search</button>
            <button className="btn btn--outline btn--sm" style={{ height: 36 }} onClick={() => {
              setSearch('')
              setDates({ start: '', end: '' })
              api.get('/borrowers', { params: { status: activeStatus } }).then(r => setData(r.data.data))
            }}>Reset</button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading seized vehicles...</div>
        ) : (
          <div className="table-wrap">
            <table className="table--high-density">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Borrower Details</th>
                  <th>Vehicle Details</th>
                  <th style={{ textAlign: 'center' }}>{activeStatus === 'SEIZED' ? 'Seized Date' : 'Settled Date'}</th>
                  <th style={{ textAlign: 'right' }}>Finance Amt</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map(b => (
                  <tr key={b.id} style={{ background: activeStatus === 'SEIZED' ? '#fff5f5' : '#f0fdf4' }}>
                    <td className="td-mono">
                      <strong>{b.folio_prefix}-{b.folio_no}</strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.mobile}</div>
                    </td>
                    <td>
                      {b.vehicle ? (
                        <>
                          <div style={{ fontWeight: 800 }} className="td-mono">{b.vehicle.vehicle_no}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.vehicle.model_name} • {b.vehicle.chassis_no}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>No Vehicle Data</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      <Calendar size={12} style={{ marginRight: 4, opacity: 0.5 }} />
                      {b.latest_loan?.updated_at ? fmtDate(b.latest_loan.updated_at) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>
                      ₹{fmtCurrency(b.latest_loan?.finance_amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge badge--${activeStatus === 'SEIZED' ? 'danger' : 'success'}`} style={{ fontSize: 9 }}>{activeStatus}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {activeStatus === 'SEIZED' && (
                          <button 
                            className="btn btn--xs btn--outline" 
                            style={{ color: 'var(--success)', borderColor: 'var(--success)', background: '#f0fdf4' }}
                            onClick={() => handleUnseize(b.latest_loan?.id)}
                            disabled={unseizing === b.latest_loan?.id}
                          >
                            {unseizing === b.latest_loan?.id ? 'Processing...' : <><CheckCircle2 size={12} style={{ marginRight: 4 }}/> UNSEIZE</>}
                          </button>
                        )}
                        <Link to={`/loans/${b.latest_loan?.id}`} className="btn btn--xs btn--outline">
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                      No {activeStatus.toLowerCase()} items found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`
        .toggle-btn-lg { 
          padding: 8px 24px; border: none; background: transparent; 
          font-size: 14px; font-weight: 700; color: var(--text-muted); 
          cursor: pointer; border-radius: 8px; transition: all .2s;
        }
        .toggle-btn-lg.active { background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .toggle-btn-lg.active.alert { color: var(--danger); }
        .toggle-btn-lg.active.success { color: var(--success); }
        .toggle-btn-lg:hover:not(.active) { background: rgba(0,0,0,0.05); }
      `}</style>
    </div>
  )
}
