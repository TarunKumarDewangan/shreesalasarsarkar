import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { fmtCurrency, fmtDate } from '../utils'
import { Printer, RefreshCw, Search, Calendar, Filter, Users, Car, MapPin, Hash, X, Database } from 'lucide-react'
import BacklogProfile from './BacklogProfile'
import AssignmentModal from '../components/loans/AssignmentModal'

export default function CombineDueInstallment() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [staff, setStaff] = useState([])
  const [assignModal, setAssignModal] = useState(null)

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
    search_type: 'chassis', // 'chassis' or 'engine'
    search_val: '',
    search: '',
    source_filter: 'ALL', // 'ALL', 'New', 'Old'
  })

  // Selected row tracking for visual highlight
  const [selectedRowId, setSelectedRowId] = useState(null)

  // Full screen profile modal tracking for backlog
  const [selectedProfileId, setSelectedProfileId] = useState(null)

  const loadMetadata = () => {
    api.get('/combine-metadata')
      .then(r => {
        setMetadata(r.data)
      })
      .catch(e => {
        console.error('Failed to load filters metadata: ', e)
      })
  }

  const load = (p = page) => {
    setLoading(true)
    api.get('/combine-due', { params: { ...filters, page: p, per_page: 15 } })
      .then(r => {
        setData(r.data.data)
        setTotalPages(r.data.last_page)
        setTotalRecords(r.data.total)
        setPage(p)
      })
      .catch(e => {
        alert('Failed to fetch combined due list: ' + (e.response?.data?.message || e.message))
      })
      .finally(() => setLoading(false))
  }

  const loadStaff = () => {
    api.get('/recovery-men')
      .then(r => setStaff(r.data))
      .catch(e => console.error('Failed to load staff list: ', e))
  }

  useEffect(() => {
    loadMetadata()
    loadStaff()
    load(1)
  }, [])

  const handleFilterChange = (k, v) => {
    setFilters(f => ({ ...f, [k]: v }))
  }

  const handleApplyFilters = () => {
    load(1)
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
      search: '',
      source_filter: 'ALL',
    }
    setFilters(defaultFilters)
    setLoading(true)
    api.get('/combine-due', { params: { ...defaultFilters, page: 1, per_page: 15 } })
      .then(r => {
        setData(r.data.data)
        setTotalPages(r.data.last_page)
        setTotalRecords(r.data.total)
        setPage(1)
      })
      .finally(() => setLoading(false))
  }

  const getFolioDisplay = (item) => {
    return `${item.cbcode}-${item.fno}`
  }

  // Calculate page totals
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
          <h1>Combine Due Installment</h1>
          <p>Unified overdue monitoring and collection forecasting for both New and Old (Backlog) accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn--outline btn--sm" onClick={() => window.print()}>
            <Printer size={15} /> Print Report
          </button>
          <button className="btn btn--primary btn--sm" onClick={() => load(1)}>
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="card no-print" style={{ padding: '24px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} /> Overdue Filter & Search Parameters
        </div>
        
        {/* Row 1: Source, Dropdowns, basic inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Database size={12} /> Source</label>
            <select className="form-control form-control--sm" value={filters.source_filter} onChange={e => handleFilterChange('source_filter', e.target.value)}>
              <option value="ALL">ALL SOURCES</option>
              <option value="New">NEW (Active Database)</option>
              <option value="Old">OLD (Backlog Excel)</option>
            </select>
          </div>

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
        </div>

        {/* Row 2: Range and Date Filters */}
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
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Filter size={12} /> Due Months &gt;=</label>
            <input type="number" className="form-control form-control--sm" min="0" step="0.1" value={filters.due_months_min} onChange={e => handleFilterChange('due_months_min', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label--xs" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#475569' }}><Car size={12} /> Vehicle Make Year</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="number" className="form-control form-control--sm" placeholder="Min Year" value={filters.make_start} onChange={e => handleFilterChange('make_start', e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: '11px', opacity: 0.5, fontWeight: 600 }}>-</span>
              <input type="number" className="form-control form-control--sm" placeholder="Max Year" value={filters.make_end} onChange={e => handleFilterChange('make_end', e.target.value)} style={{ flex: 1 }} />
            </div>
          </div>
        </div>

        {/* Row 3: Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <button className="btn btn--outline btn--sm" style={{ width: '120px', height: '36px' }} onClick={resetFilters}>Reset</button>
          <button className="btn btn--primary btn--sm" style={{ width: '160px', height: '36px' }} onClick={handleApplyFilters}>Apply Filters</button>
        </div>
      </div>

      {/* Bottom Search Bar (Name/Chassis/Engine) */}
      <div className="card no-print" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', background: '#f8fafc' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '300px', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control form-control--sm" 
              placeholder="Search by customer name, folio, mobile..." 
              style={{ paddingLeft: 36 }}
              value={filters.search} 
              onChange={e => handleFilterChange('search', e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && load(1)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px' }}>
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
          <div style={{ width: '180px' }}>
            <input 
              type="text" 
              className="form-control form-control--sm" 
              placeholder={`Search ${filters.search_type === 'chassis' ? 'Chassis' : 'Engine'}...`}
              value={filters.search_val} 
              onChange={e => handleFilterChange('search_val', e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && load(1)}
            />
          </div>
        </div>
        
        <button className="btn btn--primary btn--sm" onClick={() => load(1)}>
          Search
        </button>
      </div>

      {/* Print-only Title Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 5 }}>Shree Salasar Sarkar</h2>
        <h3 style={{ textAlign: 'center', marginBottom: 15 }}>Combined Due Installment Report</h3>
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
            Loading combined due details...
          </div>
        ) : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Source</th>
                  <th style={{ width: 100 }}>Folio No.</th>
                  <th>Borrower's Name</th>
                  <th>Model</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Instalment Rate</th>
                  <th style={{ textAlign: 'right' }}>Current Balance</th>
                  <th style={{ textAlign: 'center' }}>Due Inst.</th>
                  <th>Mobile No.</th>
                  <th>Vehicle No.</th>
                  <th>Recovery Executive</th>
                  <th style={{ width: 100 }} className="no-print">Action</th>
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
                      <td onClick={e => e.stopPropagation()}>
                        <span className={`source-badge source-badge--${item.source.toLowerCase()}`}>
                          {item.source}
                        </span>
                      </td>
                      <td className={`td-mono td-folio td-folio-${item.type}`}>{getFolioDisplay(item)}</td>
                      <td>
                        {item.source === 'New' ? (
                          <Link
                            to={`/borrowers/${item.borrower_id}/ledger`}
                            style={{ fontWeight: 800, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'none' }}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.customer_name}
                          </Link>
                        ) : (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProfileId(item.id.replace('old-', ''))
                            }}
                            style={{ fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                            className="hover:underline"
                          >
                            {item.customer_name}
                          </span>
                        )}
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
                      <td>
                        {item.recovery_man_name ? (
                          <div>
                            <strong style={{ fontSize: '13px' }}>{item.recovery_man_name}</strong>
                            {item.collection_date && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Date: {fmtDate(item.collection_date)}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="no-print" onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn btn--outline btn--sm btn--xs" 
                          onClick={() => setAssignModal(item)} 
                          title="Assign Recovery" 
                          style={{ color: 'var(--primary)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Calendar size={12}/> Assign
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No combined due records found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
              {data.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan="5" style={{ textAlign: 'right' }}>Page Total:</td>
                    <td className="td-mono" style={{ textAlign: 'right' }}>₹{fmtCurrency(totalInstRate)}</td>
                    <td className="td-mono" style={{ textAlign: 'right' }}>₹{fmtCurrency(totalCurrentBalance)}</td>
                    <td colSpan="5"></td>
                  </tr>
                </tfoot>
              )}
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)' }} className="no-print">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Showing {data.length} of {totalRecords || ''} due cases</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--outline btn--sm" disabled={page <= 1} onClick={() => load(page - 1)}>← Prev</button>
                  <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>Page {page} / {totalPages}</span>
                  <button className="btn btn--outline btn--sm" disabled={page >= totalPages} onClick={() => load(page + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModal && (
        <AssignmentModal
          borrower={{
            id: assignModal.source === 'New' ? assignModal.borrower_id : assignModal.id.replace('old-', ''),
            recovery_man_id: assignModal.recovery_man_id,
            collection_date: assignModal.collection_date
          }}
          staff={staff}
          apiEndpoint={
            assignModal.source === 'New'
              ? `/borrowers/${assignModal.borrower_id}`
              : `/backlog/${assignModal.id.replace('old-', '')}/assign-recovery-man`
          }
          onClose={() => setAssignModal(null)}
          onSaved={() => {
            setAssignModal(null)
            load(page)
          }}
        />
      )}

      {/* Full-width Statement Modal for legacy records */}
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
