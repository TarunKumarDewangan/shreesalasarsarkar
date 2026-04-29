import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../api'
import { Search, PlusCircle, Edit2, Trash2, X, Car, Wallet, FileText, UserPlus, Calendar, CheckSquare, Printer } from 'lucide-react'
import LiveSearchInput from '../components/LiveSearchInput'
import PayModal from '../components/PayModal'
import ReceiptModal from '../components/ReceiptModal'
import { useAuth } from '../contexts/AuthContext'
import { fmtDate, fmtCurrency } from '../utils'


function RecoveredModal({ borrower, onClose, onSaved }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/recoveries', {
        borrower_id: borrower.id,
        amount,
        notes,
        collection_date: new Date().toISOString().split('T')[0]
      })
      onSaved()
    } catch (ex) {
      alert('Failed to submit recovery.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Take Recovery Payment</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Borrower: <strong>{borrower.name}</strong></div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Folio: {borrower.folio_prefix}-{borrower.folio_no}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount Collected (₹)</label>
              <input type="number" className="form-control" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Notes (Optional)</label>
              <textarea className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Received by someone else" rows={2} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Mark as Taken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BorrowerModal({ borrower, onClose, onSaved, staff = [], zones = [] }) {
  const isEdit = !!borrower?.id
  const empty = { recovery_man_id:'', collection_date: new Date().toISOString().split('T')[0], folio_prefix:'O', folio_no:'', zone:'', name:'', father_name:'', mobile:'', mobile2:'', aadhar:'', pan:'', dob:'', address:'', g_name:'', g_father:'', g_mobile:'', g_address:'' }
  const [form, setForm] = useState(isEdit ? { 
    ...borrower,
    recovery_man_id: borrower.recovery_man_id || '',
    collection_date: borrower.collection_date || new Date().toISOString().split('T')[0],
    g_father: borrower.guarantor?.father_name || '',
    g_mobile: borrower.guarantor?.mobile || '',
    g_address: borrower.guarantor?.address || ''
  } : empty)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async e => {
    e.preventDefault(); setErr(''); setSaving(true)
    try {
      const body = {
        ...form,
        guarantor: form.g_name ? {
          name: form.g_name,
          father_name: form.g_father,
          mobile: form.g_mobile,
          address: form.g_address
        } : null
      }
      if (isEdit) await api.put(`/borrowers/${borrower.id}`, body)
      else         await api.post('/borrowers', body)
      onSaved()
    } catch (ex) {
      const errs = ex.response?.data?.errors
      setErr(errs ? Object.values(errs).flat().join(', ') : ex.response?.data?.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Borrower' : 'Add Borrower'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            {err && <div className="alert alert--error">{err}</div>}
            <div className="grid-3" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Folio Prefix *</label>
                <select className="form-control form-control--sm" value={form.folio_prefix||'O'} onChange={set('folio_prefix')}>
                  <option value="O">O</option>
                  <option value="S">S</option>
                  <option value="KC">KC</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Folio No. *</label>
                <input className="form-control form-control--sm" value={form.folio_no||''} onChange={set('folio_no')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <input className="form-control form-control--sm" list="br-zone-list" value={form.zone||''} onChange={set('zone')} />
                <datalist id="br-zone-list">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control form-control--sm" value={form.name||''} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Father / Husband Name</label>
                <input className="form-control form-control--sm" value={form.father_name||''} onChange={set('father_name')} />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input className="form-control form-control--sm" value={form.mobile||''} onChange={set('mobile')} />
              </div>
              <div className="form-group">
                <label className="form-label">Aadhar No.</label>
                <input className="form-control form-control--sm" value={form.aadhar||''} onChange={set('aadhar')} />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">PAN No.</label>
                <input className="form-control form-control--sm" value={form.pan||''} onChange={set('pan')} />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input className="form-control form-control--sm" type="date" value={form.dob||''} onChange={set('dob')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control form-control--sm" rows={2} value={form.address||''} onChange={set('address')} />
            </div>

            <div style={{ margin: '16px 0 8px', fontWeight: 700, color: 'var(--primary)', fontSize: 13, borderBottom: '1px solid var(--primary-bg)' }}>
              Recovery Assignment
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Recovery Agent</label>
                <select className="form-control form-control--sm" value={form.recovery_man_id} onChange={set('recovery_man_id')}>
                  <option value="">-- None --</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Collection Date</label>
                <input type="date" className="form-control form-control--sm" value={form.collection_date} onChange={set('collection_date')} required />
              </div>
            </div>

            <div style={{ margin: '16px 0 8px', fontWeight: 700, color: 'var(--primary)', fontSize: 13, borderBottom: '1px solid var(--primary-bg)' }}>
              Guarantor Details (Optional)
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Guarantor Name</label>
                <input className="form-control form-control--sm" value={form.g_name||''} onChange={set('g_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Father Name</label>
                <input className="form-control form-control--sm" value={form.g_father||''} onChange={set('g_father')} />
              </div>
            </div>
            <div className="grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input className="form-control form-control--sm" value={form.g_mobile||''} onChange={set('g_mobile')} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control form-control--sm" value={form.g_address||''} onChange={set('g_address')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Borrower'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Borrowers() {
  const { user, isStaff, isFinancer, isAdmin } = useAuth()
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null)
  const [recoveredModal, setRecoveredModal] = useState(null)
  const [page, setPage]       = useState(1)
  const [meta, setMeta]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [receiptModal, setReceiptModal] = useState(null)
  const [insLoading, setInsLoading] = useState(false)
  const [installments, setInstallments] = useState([])
  const [staff, setStaff] = useState([])
  const [zones, setZones] = useState([])
  const [filters, setFilters] = useState({ 
    recovery_man_id: '', 
    collection_day: '',
    assigned_only: isStaff ? true : false,
    start_date: '',
    end_date: '',
    exact_date: '',
    status: ''
  })
  const loc = useLocation()

  const loadStaff = () => api.get('/recovery-men').then(r => setStaff(r.data))
  const loadZones = () => api.get('/borrowers/zones').then(r => setZones(r.data))

  const load = (p = 1, q = '', f = filters) => {
    setLoading(true)
    const params = { page: p, search: q, ...f }
    api.get('/borrowers', { params })
      .then(r => {
        setList(r.data.data ?? r.data)
        setMeta(r.data.meta ?? r.data)
        setPage(p)
      })
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    // Run both in parallel instead of sequentially
    Promise.all([loadStaff(), loadZones()])
  }, [])

  useEffect(() => {
    load(1, search, filters)
    if (loc.pathname === '/borrowers/new') setModal('add')
  }, [loc.pathname, filters])

  const del = async id => {
    if (!confirm('Delete this borrower?')) return
    await api.delete(`/borrowers/${id}`)
    load(page, search)
  }

  useEffect(() => {
    if (selected?.id && !selected.latest_loan?.total_installments) {
      // If we don't have full details (e.g. from the main list), fetch them
      api.get(`/borrowers/${selected.id}`).then(r => {
        setSelected(r.data)
      })
    }

    if (selected?.latest_loan) {
      setInsLoading(true)
      api.get(`/loans/${selected.latest_loan.id}/installments`)
        .then(r => setInstallments(r.data))
        .finally(() => setInsLoading(false))
    } else {
      setInstallments([])
    }
  }, [selected?.id])

  const payIns = async (id, data) => {
    try {
      if (isStaff) {
        const baseAmount = parseFloat(payModal.amount_due || 0)
        const penalty = parseFloat(data.penalty || 0)
        const discount = parseFloat(data.discount || 0)
        const payload = {
          borrower_id: selected?.id,
          amount: baseAmount + penalty - discount,
          collection_date: data.paid_date,
          notes: data.notes,
          installment_id: payModal.id,
          penalty: data.penalty,
          discount: data.discount,
          payment_method: data.method,
          receipt_no: data.receipt_no,
          paid_date: data.paid_date
        }
        await api.post('/recoveries', payload)
        alert('Recovery payment submitted for verification.')
      } else {
        await api.patch(`/installments/${id}/pay`, data)
      }
      
      // Fetch updated borrower data to refresh sidebar counts
      const br = await api.get(`/borrowers/${selected.id}`)
      setSelected(br.data)

      // Refresh installments for sidebar
      if (br.data.latest_loan?.id) {
        const r = await api.get(`/loans/${br.data.latest_loan.id}/installments`)
        setInstallments(r.data)
      }
      
      // Refresh list to update main table
      load(page, search)
      setPayModal(null)
    } catch (e) {
      const msg = e.response?.data?.message || 'Payment failed'
      alert(msg)
    }
  }

  const handleQuickPay = async (res) => {
    const loanId = res.loan_id || res.latest_loan?.id
    if (!loanId) return alert("No active loan found.")
    
    setInsLoading(true)
    try {

      const r = await api.get(`/loans/${loanId}/installments`)
      const fetchedIns = r.data
      const nextPending = fetchedIns.find(i => i.status === 'PENDING')
      
      // Update local installments state for consistency
      setInstallments(fetchedIns)
      
      if (nextPending) {
        // Set selected to ensure sidebar and context are correct
        const br = await api.get(`/borrowers/${res.borrower_id || res.id}`)
        setSelected(br.data)
        setPayModal(nextPending)
      } else {
        alert("No pending installments for this loan.")
      }
    } catch (e) {
      alert("Failed to fetch installments: " + (e.response?.data?.message || e.message))
    } finally {
      setInsLoading(false)
    }
  }

  const handleSearch = e => {
    const q = e.target.value
    setSearch(q)
    load(1, q)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Borrowers</h1>
        <p>Manage your borrower records</p>
      </div>

      <div className="borrowers-layout">
        <div className="borrowers-main">
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="toolbar" style={{ padding:'16px 20px 0' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <LiveSearchInput 
                onSearch={setSearch} 
                onSelect={(res) => {
                  setLoading(true)
                  api.get(`/borrowers/${res.id}`).then(r => {
                    setList([r.data])
                    setMeta({ total: 1, current_page: 1, last_page: 1 })
                    setSelected(r.data)
                  }).finally(() => setLoading(false))
                }}
                onQuickAction={handleQuickPay}
                placeholder="Search by name, vehicle or mobile..." 
              />
            </div>
            {isStaff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary-bg)', padding: '4px 12px', borderRadius: 20 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Only My Assignments</span>
                <input 
                  type="checkbox" 
                  checked={filters.assigned_only} 
                  onChange={e => setFilters(f => ({ ...f, assigned_only: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="filter-group">
                <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>EXACT DATE</label>
                <input type="date" className="form-control form-control--sm" style={{ width: 120 }} value={filters.exact_date} onChange={e => setFilters(f => ({ ...f, exact_date: e.target.value, start_date: '', end_date: '' }))} />
              </div>
              <div className="filter-group">
                <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>FROM</label>
                <input type="date" className="form-control form-control--sm" style={{ width: 120 }} value={filters.start_date} onChange={e => setFilters(f => ({ ...f, start_date: e.target.value, exact_date: '' }))} />
              </div>
              <div className="filter-group">
                <label className="form-label" style={{ fontSize: 9, marginBottom: 2 }}>TO</label>
                <input type="date" className="form-control form-control--sm" style={{ width: 120 }} value={filters.end_date} onChange={e => setFilters(f => ({ ...f, end_date: e.target.value, exact_date: '' }))} />
              </div>
              <div className="filter-group">
                <label className="form-label" style={{ fontSize: 10, marginBottom: 4, display: 'block' }}>COLLECTION DAY</label>
                <input 
                  type="date" 
                  className="form-control form-control--sm" 
                  value={filters.collection_day} 
                  onChange={e => setFilters(f => ({ ...f, collection_day: e.target.value }))} 
                />
              </div>
              {(filters.exact_date || filters.start_date || filters.end_date) && (
                <button className="btn btn--ghost btn--sm" style={{ marginTop: 14 }} onClick={() => setFilters(f => ({ ...f, exact_date: '', start_date: '', end_date: '' }))}>
                  <X size={14} />
                </button>
              )}
            </div>

            {(isFinancer || isAdmin) && (
              <Link className="btn btn--primary" to="/borrowers/new">
                <PlusCircle size={15}/> Add Borrower
              </Link>
            )}
          </div>

            {loading ? <p className="loading-text">Loading…</p> : (
            <div className="table-wrap" style={{ marginTop:16 }}>
              <table className="responsive-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th className="mobile-hidden">FOLIO</th>
                    <th>NAME</th>
                    <th className="mobile-hidden">VEHICLE NO</th>
                    <th className="mobile-hidden">MOBILE</th>
                    <th className="mobile-hidden">ADDRESS</th>
                    <th className="mobile-hidden">SCHEDULE DATE</th>
                    <th className="mobile-hidden">ZONE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length === 0 ? (
                    <tr><td colSpan={10} className="loading-text">No borrowers found.</td></tr>
                  ) : list.map(b => (
                    <tr key={b.id} className={selected?.id === b.id ? 'row-selected' : ''} onClick={() => setSelected(selected?.id === b.id ? null : b)} style={{ cursor: 'pointer' }}>
                      <td>
                        <input 
                          type="checkbox" 
                          tabIndex="-1"
                          checked={selected?.id === b.id} 
                          readOnly
                        />
                      </td>
                      <td className="mobile-hidden" data-label="Folio">
                        <span className="td-mono">{b.folio_prefix}-{b.folio_no}</span>
                      </td>
                      <td data-label="Name">
                        <Link to={`/borrowers/${b.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }} className="hover:underline">{b.name}</div>
                        </Link>
                        <div className="mobile-only-show" style={{ fontSize: 10, opacity: 0.6 }}>{b.folio_prefix}-{b.folio_no}</div>
                      </td>
                      <td className="mobile-hidden td-mono" data-label="Vehicle" style={{ fontSize: 11 }}>{b.vehicle?.vehicle_no || '—'}</td>
                      <td className="mobile-hidden" data-label="Mobile">{b.mobile||'—'}</td>
                      <td className="mobile-hidden" data-label="Address">
                        <div style={{ fontSize: 11, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.address}>
                          {b.address || '—'}
                        </div>
                      </td>
                      <td className="mobile-hidden" data-label="Schedule">
                        <span className={`badge badge--${b.collection_date ? 'primary-bg' : 'gray'}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                          {b.collection_date ? fmtDate(b.collection_date) : 'Not Set'}
                        </span>
                      </td>
                      <td className="mobile-hidden" data-label="Zone">{b.zone||'—'}</td>
                      <td data-label="Actions">
                        <div style={{ display:'flex', gap:6 }}>
                          {isStaff && b.latest_loan && (
                            <button className="btn btn--primary btn--sm" onClick={() => handleQuickPay(b)} title="Take Recovery">
                              <CheckSquare size={13}/>
                            </button>
                          )}
                          
                          {(isFinancer || isAdmin) && (
                            <>
                              <Link className="btn btn--outline btn--sm" to={`/borrowers/${b.id}/vehicle/new`} title="Vehicle Edit">
                                <Car size={13}/> <span style={{marginLeft: 4, fontSize: 10}}>Vehicle</span>
                              </Link>
                              {b.latest_loan && (
                                <>
                                  <button className="btn btn--outline btn--sm" onClick={() => handleQuickPay(b)} title="Quick Pay Installment" style={{ color: 'var(--success)' }}>
                                    <span style={{ fontWeight: 800 }}>₹</span> <span style={{marginLeft: 4, fontSize: 10}}>Pay</span>
                                  </button>
                                </>
                              )}
                              <button className="btn btn--outline btn--sm" onClick={() => setModal(b)} title="Borrower & Guarantor Edit">
                                <Edit2 size={13}/> <span style={{marginLeft: 4, fontSize: 10}}>Edit</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

      {recoveredModal && (
        <RecoveredModal
          borrower={recoveredModal}
          onClose={() => setRecoveredModal(null)}
          onSaved={() => { setRecoveredModal(null); load(page, search, filters) }}
        />
      )}

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div style={{ display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 16px', borderTop:'1px solid var(--border)' }}>
                  <button className="btn btn--outline btn--sm" disabled={page<=1} onClick={() => load(page-1, search)}>← Prev</button>
                  <span style={{ alignSelf:'center', fontSize:13, color:'var(--text-muted)' }}>Page {page} / {meta.last_page}</span>
                  <button className="btn btn--outline btn--sm" disabled={page>=meta.last_page} onClick={() => load(page+1, search)}>Next →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="card side-panel animate-in" style={{ flex: '1 1 35%', position: 'sticky', top: 20, minWidth: 320 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Borrower Quick-View</span>
              <button className="btn btn--ghost btn--sm" onClick={() => setSelected(null)}><X size={16}/></button>
            </div>
            <div className="card-body" style={{ padding: 20 }}>
              <div className="view-section">
                <label>IDENTITY</label>
                <div className="view-grid">
                  <div className="view-item"><span>Folio:</span> <strong>{selected.folio_prefix}-{selected.folio_no}</strong></div>
                  <div className="view-item"><span>Name:</span> <strong>{selected.name}</strong></div>
                  <div className="view-item"><span>S/O:</span> {selected.father_name}</div>
                  <div className="view-item"><span>Mobile:</span> {selected.mobile}</div>
                  <div className="view-item"><span>Mobile 2:</span> {selected.mobile2 || '—'}</div>
                  <div className="view-item"><span>DOB:</span> {fmtDate(selected.dob)}</div>
                  <div className="view-item"><span>Aadhar:</span> {selected.aadhar || '—'}</div>
                  <div className="view-item"><span>PAN:</span> {selected.pan || '—'}</div>
                  <div className="view-item" style={{ gridColumn: 'span 2' }}><span>Address:</span> {selected.address}</div>
                  <div className="view-item"><span>Recovery Agent:</span> <strong>{selected.recovery_man?.name || 'Unassigned'}</strong></div>
                  <div className="view-item"><span>Assign Date:</span> {selected.collection_day ? fmtDate(selected.collection_day) : 'Not Set'}</div>
                </div>
              </div>

              {selected.vehicle && (
                <div className="view-section">
                  <label>ASSET / VEHICLE</label>
                  <div className="view-grid">
                    <div className="view-item"><span>Vehicle:</span> <strong>{selected.vehicle.vehicle_no}</strong></div>
                    <div className="view-item"><span>Model:</span> {selected.vehicle.model_name}</div>
                    <div className="view-item"><span>Chassis:</span> {selected.vehicle.chassis_no}</div>
                  </div>
                </div>
              )}

              {selected.latest_loan ? (
                <div className="view-section">
                  <label>FINANCE & INSTALLMENTS</label>
                  <div className="stats-mini">
                    <div className="stat-mini">
                      <div className="stat-mini__val">{selected.latest_loan.paid_installments} / {selected.latest_loan.total_installments}</div>
                      <div className="stat-mini__label">Installments Paid</div>
                    </div>
                    <div className="stat-mini">
                      <div className="stat-mini__val" style={{ color: 'var(--danger)' }}>{selected.latest_loan.pending_installments}</div>
                      <div className="stat-mini__label">Pending</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:700, opacity:0.6 }}>ALL INSTALLMENTS</span>
                    </div>
                    {insLoading ? <p className="loading-text" style={{ padding: 10 }}>Loading ledger...</p> : (
                      <div className="mini-ledger" style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {installments.map(ins => (
                          <div key={ins.id} className="mini-ledger-item" style={{ opacity: ins.status === 'PAID' ? 0.6 : 1, marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>₹{fmtCurrency(ins.amount_due)}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                Due: {fmtDate(ins.due_date)} 
                                <span style={{ marginLeft: 8, opacity: 0.7 }}>
                                  (P: {fmtCurrency(ins.principal_amount)} | I: {fmtCurrency(ins.interest_amount)})
                                </span>
                              </div>
                            </div>
                            {ins.status === 'PAID' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="badge badge--success" style={{ fontSize: 9, padding: '2px 8px' }}>PAID</span>
                                <button className="btn btn--outline btn--xs" onClick={(e) => { e.stopPropagation(); setReceiptModal(ins); }} title="Print Receipt" style={{ padding: '2px 4px' }}>
                                  <Printer size={10} />
                                </button>
                              </div>
                            ) : ins.pending_recovery_count > 0 ? (
                              <span className="badge badge--warning" style={{ fontSize: 9, padding: '2px 8px' }}>SENT</span>
                            ) : (
                              <button className="btn btn--primary btn--xs" onClick={() => setPayModal(ins)} style={{fontSize: '9px', whiteSpace: 'nowrap'}}>
                                SEND FOR SCRUITY
                              </button>
                            )}
                          </div>
                        ))}
                        {installments.length === 0 && (
                          <div style={{ fontSize: 11, textAlign: 'center', padding: 10, color: 'var(--text-muted)' }}>No installments found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="view-grid" style={{ marginTop: 12 }}>
                    <div className="view-item"><span>Gross:</span> ₹{fmtCurrency(selected.latest_loan.gross_amount)}</div>
                    <div className="view-item"><span>Installment:</span> ₹{fmtCurrency(selected.latest_loan.installment_amount)}</div>
                    <div className="view-item"><span>Status:</span> 
                      {selected.latest_loan.status === 'VERIFYING' ? (
                        <span className="badge badge--warning">Verification Pending</span>
                      ) : selected.latest_loan.status === 'REJECTED' ? (
                        <span className="badge badge--danger">Rejected</span>
                      ) : (
                        <span className="badge badge--success">{selected.latest_loan.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert--info" style={{ marginTop: 12, fontSize: 12 }}>No active finance record found.</div>
              )}

              <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link to={`/borrowers/${selected.id}/ledger`} className="btn btn--primary btn--sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 4, background: 'var(--success)', borderColor: 'var(--success)' }}>
                  <Wallet size={15} style={{ marginRight: 6 }} /> Interactive Ledger (Payments)
                </Link>
                <Link to={`/borrowers/${selected.id}/balance-sheet`} className="btn btn--outline btn--sm" style={{ width: '100%', justifyContent: 'center' }}>
                  <FileText size={15} style={{ marginRight: 6 }} /> Full Balance Sheet (Ledger)
                </Link>
                <Link to={`/borrowers/${selected.id}/vehicle/new`} className="btn btn--outline btn--sm" style={{ flex: 1 }}>Edit Asset</Link>
                <button onClick={() => setModal(selected)} className="btn btn--outline btn--sm" style={{ flex: 1 }}>Edit Identity</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {modal === 'add' && <BorrowerModal staff={staff} zones={zones} onClose={() => { setModal(null); if(loc.pathname==='/borrowers/new') nav('/borrowers') }} onSaved={() => { setModal(null); load(); if(loc.pathname==='/borrowers/new') nav('/borrowers') }} />}
      {modal?.id && <BorrowerModal borrower={modal} staff={staff} zones={zones} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(page, search) }} />}
      {payModal && (
        <PayModal 
          installment={payModal} 
          allInstallments={installments}
          onPay={data => payIns(payModal.id, data)} 
          onClose={() => setPayModal(null)} 
          isStaff={isStaff}
        />
      )}
      {receiptModal && (
        <ReceiptModal 
          installment={receiptModal}
          borrower={selected}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  )
}
