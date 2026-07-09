import React, { useState, useEffect } from 'react'
import api from '../api'
import { fmtCurrency, fmtDate } from '../utils'
import { Printer, RefreshCw, Search, Calendar, Filter, Users, Car, MapPin, Hash, X } from 'lucide-react'
import BacklogProfile from './BacklogProfile'

export default function BacklogDue() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pendingPage, setPendingPage] = useState(false)
  const [metadata, setMetadata] = useState({
    financers: [],
    zones: [],
    models: []
  })

  const [filters, setFilters] = useState({
    due_date_start: '',
    due_date_end: '',
    folio_start: '',
    folio_end: '',
    financer: 'ALL',
    zone: 'ALL',
    model: 'ALL',
    make_start: '',
    make_end: '',
    vehicle_no: '',
    agreement_date_start: '',
    agreement_date_end: '',
    total_months_start: '',
    total_months_end: '',
    due_months_min: '0',
    search_type: 'chassis', // 'chassis', 'engine', 'owner_name', or 'vehicle_no'
    search_val: '',
  })

  // Selected row tracking for visual highlight (matches legacy blue selection)
  const [selectedRowId, setSelectedRowId] = useState(null)

  // Full screen profile modal tracking
  const [selectedProfileId, setSelectedProfileId] = useState(null)

  // Selection list for checkboxes
  const [checkedIds, setCheckedIds] = useState({})

  const loadMetadata = (allItems) => {
    const financers = [...new Set(allItems.map(i => i.cbcode).filter(Boolean))]
    const zones = [...new Set(allItems.map(i => i.zone).filter(Boolean))]
    const models = [...new Set(allItems.map(i => i.vehicle_model).filter(Boolean))]
    setMetadata({ financers, zones, models })
  }

  const load = (isInitial = false, pageOverride = null) => {
    const currentPage = pageOverride ?? page
    setLoading(true)
    const params = { ...(isInitial ? {} : filters), page: currentPage }
    api.get('/backlog-due', { params })
      .then(r => {
        const items = r.data.data ?? r.data
        setData(items)
        setLastPage(r.data.last_page ?? 1)
        setTotal(r.data.total ?? items.length)
        if (isInitial) {
          loadMetadata(items)
        }
      })
      .catch(e => {
        alert('Failed to fetch backlog due list: ' + (e.response?.data?.message || e.message))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(true)
  }, [])

  // Re-fetch when page changes (after user interaction)
  useEffect(() => {
    if (pendingPage) {
      load(false)
      setPendingPage(false)
    }
  }, [page])

  const handleFilterChange = (k, v) => {
    setFilters(f => ({ ...f, [k]: v }))
  }

  const resetFilters = () => {
    const defaultFilters = {
      due_date_start: '',
      due_date_end: '',
      folio_start: '',
      folio_end: '',
      financer: 'ALL',
      zone: 'ALL',
      model: 'ALL',
      make_start: '',
      make_end: '',
      vehicle_no: '',
      agreement_date_start: '',
      agreement_date_end: '',
      total_months_start: '',
      total_months_end: '',
      due_months_min: '0',
      search_type: 'chassis',
      search_val: '',
    }
    setFilters(defaultFilters)
    setPage(1)
    setLoading(true)
    api.get('/backlog-due', { params: { ...defaultFilters, page: 1 } })
      .then(r => {
        setData(r.data.data ?? r.data)
        setLastPage(r.data.last_page ?? 1)
        setTotal(r.data.total ?? 0)
      })
      .finally(() => setLoading(false))
  }

  const getFolioDisplay = (item) => {
    const prefix = item.cbcode ? item.cbcode.charAt(0).toUpperCase() : 'O'
    return `${prefix}-${item.fno}`
  }

  const toggleCheck = (id) => {
    setCheckedIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleCheckAll = () => {
    const allChecked = data.every(item => checkedIds[item.id])
    const nextChecked = {}
    if (!allChecked) {
      data.forEach(item => {
        nextChecked[item.id] = true
      })
    }
    setCheckedIds(nextChecked)
  }

  // Calculate totals
  const totalInstRate = data.reduce((sum, item) => sum + parseFloat(item.installment_amount || 0), 0)
  const totalCurrentBalance = data.reduce((sum, item) => sum + parseFloat(item.current_balance || 0), 0)

  return (
    <div className="backlog-due-container">
      <style>{`
        .due-row-seized td {
          color: #ef4444 !important;
        }
        .due-row-selected td {
          background-color: #e0f2fe !important;
          color: #0369a1 !important;
        }
        .due-row-selected .td-folio {
          color: #0284c7 !important;
        }
        .td-folio {
          font-weight: 700;
        }
        .td-folio-P {
          color: var(--primary);
        }
        .td-folio-F {
          color: var(--success);
        }
        .td-folio-S {
          color: var(--danger);
        }
        @media print {
          .no-print, .sidebar, .top-bar, .page-header--mobile {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .page-wrapper {
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            background: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-size: 11px !important;
          }
          .due-row-seized td {
            color: #ef4444 !important;
            font-weight: 600;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1>Due Installment Backlog</h1>
          <p>Overdue monitoring and collection forecasting for legacy backlog accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn--outline btn--sm" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => load(false)}>
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="card no-print" style={{ padding: '24px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} /> Overdue Filter & Search Parameters
        </div>
        
        {/* Row 1: Dropdowns and text inputs (Categorical and Basic Filters) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Users size={12} /> Financer/CB Code</label>
            <select className="form-control form-control--sm" value={filters.financer} onChange={e => handleFilterChange('financer', e.target.value)}>
              <option value="ALL">ALL</option>
              {metadata.financers.map(f => <option key={f} value={f}>{f || 'EMPTY'}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><MapPin size={12} /> Zone</label>
            <select className="form-control form-control--sm" value={filters.zone} onChange={e => handleFilterChange('zone', e.target.value)}>
              <option value="ALL">ALL</option>
              {metadata.zones.map(z => <option key={z} value={z}>{z || 'EMPTY'}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Car size={12} /> Model</label>
            <select className="form-control form-control--sm" value={filters.model} onChange={e => handleFilterChange('model', e.target.value)}>
              <option value="ALL">ALL</option>
              {metadata.models.map(m => <option key={m} value={m}>{m || 'EMPTY'}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Car size={12} /> Vehicle No.</label>
            <input type="text" className="form-control form-control--sm" placeholder="e.g. CG05" value={filters.vehicle_no} onChange={e => handleFilterChange('vehicle_no', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Filter size={12} /> Due Months &gt;=</label>
            <input type="number" className="form-control form-control--sm" min="0" step="0.1" value={filters.due_months_min} onChange={e => handleFilterChange('due_months_min', e.target.value)} />
          </div>
        </div>

        {/* Row 2: Range and Date Filters (These require more width) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Calendar size={12} /> Due Date Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" className="form-control form-control--sm" value={filters.due_date_start} onChange={e => handleFilterChange('due_date_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>to</span>
              <input type="date" className="form-control form-control--sm" value={filters.due_date_end} onChange={e => handleFilterChange('due_date_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Calendar size={12} /> Agreement Date Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" className="form-control form-control--sm" value={filters.agreement_date_start} onChange={e => handleFilterChange('agreement_date_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>to</span>
              <input type="date" className="form-control form-control--sm" value={filters.agreement_date_end} onChange={e => handleFilterChange('agreement_date_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Hash size={12} /> Folio No. Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" className="form-control form-control--sm" placeholder="Min" value={filters.folio_start} onChange={e => handleFilterChange('folio_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>-</span>
              <input type="number" className="form-control form-control--sm" placeholder="Max" value={filters.folio_end} onChange={e => handleFilterChange('folio_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Car size={12} /> Vehicle Make Year</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" className="form-control form-control--sm" placeholder="Min Year" value={filters.make_start} onChange={e => handleFilterChange('make_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>-</span>
              <input type="number" className="form-control form-control--sm" placeholder="Max Year" value={filters.make_end} onChange={e => handleFilterChange('make_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Calendar size={12} /> Total Months Range</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" className="form-control form-control--sm" placeholder="Min Months" value={filters.total_months_start} onChange={e => handleFilterChange('total_months_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>-</span>
              <input type="number" className="form-control form-control--sm" placeholder="Max Months" value={filters.total_months_end} onChange={e => handleFilterChange('total_months_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        {/* Row 3: Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button className="btn btn--outline btn--sm" style={{ width: '120px', height: '36px' }} onClick={resetFilters}>Reset</button>
          <button className="btn btn--primary btn--sm" style={{ width: '160px', height: '36px' }} onClick={() => load(false, 1)}>Apply Filters</button>
        </div>
      </div>

      {/* Bottom Search Bar (Chassis/Engine) */}
      <div className="card no-print" style={{ padding: '12px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              name="search_type"
              checked={filters.search_type === 'chassis'}
              onChange={() => handleFilterChange('search_type', 'chassis')}
            />
            Chassis No.
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              name="search_type"
              checked={filters.search_type === 'engine'}
              onChange={() => handleFilterChange('search_type', 'engine')}
            />
            Engine No.
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              name="search_type"
              checked={filters.search_type === 'owner_name'}
              onChange={() => handleFilterChange('search_type', 'owner_name')}
            />
            Owner Name
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="radio"
              name="search_type"
              checked={filters.search_type === 'vehicle_no'}
              onChange={() => handleFilterChange('search_type', 'vehicle_no')}
            />
            Vehicle No.
          </label>
        </div>
        <div style={{ flex: '1', maxWidth: '300px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-control form-control--sm"
            placeholder={`Search ${
              filters.search_type === 'chassis' ? 'Chassis' :
              filters.search_type === 'engine' ? 'Engine' :
              filters.search_type === 'owner_name' ? 'Owner Name' : 'Vehicle'
            }...`}
            value={filters.search_val}
            onChange={e => handleFilterChange('search_val', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(false, 1)}
          />
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => load(false, 1)}>
          <Search size={14} /> Search
        </button>
      </div>

      {/* Print-only Title Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 5 }}>Shree Salasar Sarkar</h2>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>Due Installment Backlog Report</h3>
        {filters.due_date_start && (
          <p style={{ textAlign: 'center', fontSize: 12, marginBottom: 15 }}>
            Period: {fmtDate(filters.due_date_start)} to {fmtDate(filters.due_date_end || new Date().toISOString().split('T')[0])}
          </p>
        )}
      </div>

      {/* Results Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading due backlog details...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Folio No.</th>
                  <th>Borrower's Name</th>
                  <th>Model</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Instalment Rate</th>
                  <th style={{ textAlign: 'right' }}>Current Balance</th>
                  <th style={{ textAlign: 'center' }}>Due Inst.</th>
                  <th>Mobile No.</th>
                  <th>Vehicle No.</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => {
                  const isSeized = item.type === 'S'
                  const isSelected = selectedRowId === item.id
                  let rowClass = ''
                  if (isSeized) rowClass += ' due-row-seized'
                  if (isSelected) rowClass += ' due-row-selected'

                  return (
                    <tr 
                      key={item.id} 
                      className={rowClass}
                      onClick={() => setSelectedRowId(isSelected ? null : item.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={`td-mono td-folio td-folio-${item.type}`}>{getFolioDisplay(item)}</td>
                      <td>
                        <span 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProfileId(item.id)
                          }}
                          style={{ fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                          className="hover:underline"
                        >
                          {item.customer_name}
                        </span>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.father_name}</div>
                      </td>
                      <td>{item.vehicle_model || '—'}</td>
                      <td className="td-mono" style={{ fontWeight: 600 }}>{fmtDate(item.due_date)}</td>
                      <td className="td-mono" style={{ textAlign: 'right', fontWeight: 600 }}>₹{fmtCurrency(item.installment_amount)}</td>
                      <td className="td-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {isSeized ? (
                          <span style={{ fontWeight: 800 }}>Seized</span>
                        ) : (
                          `₹${fmtCurrency(item.current_balance)}`
                        )}
                      </td>
                      <td className="td-mono" style={{ textAlign: 'center', fontWeight: 700 }}>
                        {item.due_inst}
                      </td>
                      <td>{item.mobile || '—'}</td>
                      <td className="td-mono">{item.vehicle_no || '—'}</td>
                    </tr>
                  )
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No due backlog records found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan="4" style={{ textAlign: 'right' }}>Total:</td>
                    <td className="td-mono" style={{ textAlign: 'right' }}>₹{fmtCurrency(totalInstRate)}</td>
                    <td className="td-mono" style={{ textAlign: 'right' }}>₹{fmtCurrency(totalCurrentBalance)}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div style={{ padding: 16, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
            <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => { setPage(p => Math.max(1, p - 1)); setPendingPage(true) }}>Prev</button>
            <span style={{ fontSize: 13 }}>Page {page} of {lastPage} ({total} records)</span>
            <button className="btn btn--outline btn--sm" disabled={page >= lastPage} onClick={() => { setPage(p => p + 1); setPendingPage(true) }}>Next</button>
          </div>
        )}
      </div>

      {/* Full-width Statement Modal */}
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
