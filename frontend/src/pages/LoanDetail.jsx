import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { 
  ChevronLeft, Save, Printer, Trash2, 
  AlertTriangle, CheckSquare, Loader2 
} from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'

const toN = v => Number(v || 0)

function calcLoan(financeAmt, agreementAmt, hpRto, months, rate) {
  const gross    = toN(financeAmt) + toN(agreementAmt) + toN(hpRto)
  const interest = (gross * toN(rate) * toN(months)) / 1200
  const total    = gross + interest
  const emi      = toN(months) > 0 ? total / toN(months) : 0
  return { gross, interest, total, emi }
}

export default function LoanDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [zones, setZones] = useState([])
  const [conditions, setConditions] = useState([])
  const [activeTab, setActiveTab] = useState('borrower')
  const [viewMode, setViewMode] = useState('tabs')
  const [showSettlement, setShowSettlement] = useState(false)
  const [settlementAmount, setSettlementAmount] = useState(0)
  const [settlementPercentage, setSettlementPercentage] = useState(100)

  useEffect(() => {
    Promise.all([
      api.get(`/loans/${id}`),
      api.get('/borrowers/zones').catch(() => ({ data: [] })),
      api.get('/borrowers/vehicle-conditions').catch(() => ({ data: [] }))
    ])
      .then(([r, zRes, cRes]) => {
        const l = r.data
        setZones(zRes.data || [])
        setConditions(cRes.data || [])
        setData({
          borrower_id: l.borrower_id,
          // Borrower
          b_name: l.borrower?.name || 'UNKNOWN',
          father_name: l.borrower?.father_name || '',
          mobile: l.borrower?.mobile || '',
          mobile2: l.borrower?.mobile2 || '',
          aadhar: l.borrower?.aadhar || '',
          pan: l.borrower?.pan || '',
          dob: l.borrower?.dob?.slice(0, 10) || '',
          address: l.borrower?.address || '',
          folio_prefix: l.borrower?.folio_prefix || 'O',
          folio_no: l.borrower?.folio_no || '',
          zone: l.borrower?.zone || '',
          // Guarantor
          g_name: l.borrower?.guarantor?.name || '',
          g_father: l.borrower?.guarantor?.father_name || '',
          g_mobile: l.borrower?.guarantor?.mobile || '',
          g_address: l.borrower?.guarantor?.address || '',
          // Vehicle
          v_condition: l.borrower?.vehicle?.condition_type || 'NEW',
          v_no: l.borrower?.vehicle?.vehicle_no || '',
          v_model: l.borrower?.vehicle?.model || '',
          v_color: l.borrower?.vehicle?.color || '',
          v_chassis: l.borrower?.vehicle?.chassis_no || '',
          v_engine: l.borrower?.vehicle?.engine_no || '',
          v_year: l.borrower?.vehicle?.make_year || '',
          v_sold_by: l.borrower?.vehicle?.sold_by || '',
          v_insurance: l.borrower?.vehicle?.insurance_expiry || '',
          // Loan
          loan_type: l.type,
          agreement_date: l.agreement_date?.slice(0, 10),
          finance_amount: l.finance_amount,
          agreement_amount: l.agreement_amount,
          hire_purchase_rto: l.hire_purchase_rto,
          total_months: l.total_months,
          interval: l.interval || 1,
          interest_rate: l.interest_rate,
          status: l.status,
          installments: l.installments || []
        })
      })
      .catch(e => {
        console.error(e)
        setError('Failed to load loan details.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const set = k => e => {
    let val = e.target.value;
    const excluded = ['email', 'password', 'password_confirmation', 'current_password', 'new_password', 'username', 'user_name', 'access_token', 'instance_id'];
    if (!excluded.includes(k)) {
      val = val.toUpperCase();
    }
    setData(d => ({ ...d, [k]: val }));
  }

  const handleUpdate = async () => {
    setSaving(true); setError('')
    try {
      // Update Borrower (includes vehicle/guarantor in my controller)
      await api.put(`/borrowers/${data.borrower_id || id}`, {
        name: data.b_name,
        father_name: data.father_name,
        mobile: data.mobile,
        mobile2: data.mobile2,
        aadhar: data.aadhar,
        pan: data.pan,
        dob: data.dob,
        address: data.address,
        folio_prefix: data.folio_prefix,
        folio_no: data.folio_no,
        zone: data.zone,
        guarantor: {
          name: data.g_name,
          father_name: data.g_father,
          mobile: data.g_mobile,
          address: data.g_address
        },
        vehicle: {
          condition_type: data.v_condition,
          vehicle_no: data.v_no,
          model: data.v_model,
          color: data.v_color,
          chassis_no: data.v_chassis,
          engine_no: data.v_engine,
          make_year: data.v_year,
          sold_by: data.v_sold_by,
          insurance_expiry: data.v_insurance
        }
      })

      // Update Loan
      await api.put(`/loans/${id}`, {
        type: data.loan_type,
        agreement_date: data.agreement_date,
        finance_amount: data.finance_amount,
        agreement_amount: data.agreement_amount,
        hire_purchase_rto: data.hire_purchase_rto,
        total_months: data.total_months,
        interval: data.interval,
        interest_rate: data.interest_rate,
        status: data.status
      })
      alert('Loan updated successfully.')
    } catch (ex) {
      setError(ex.response?.data?.message || 'Update failed.')
    } finally { setSaving(false) }
  }

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this loan as ${newStatus}?`)) return;
    
    setSaving(true);
    setError('');
    try {
      await api.put(`/loans/${id}`, { status: newStatus });
      setData(d => ({ ...d, status: newStatus }));
      alert(`Loan status updated to ${newStatus}`);
    } catch (ex) {
      setError(ex.response?.data?.message || 'Status update failed.');
    } finally {
      setSaving(false);
    }
  }

  const handleSettle = async () => {
    try {
      setSaving(true)
      await api.post(`/loans/${id}/settle`, { 
        collection_amount: settlementAmount,
        notes: `Final settlement: ₹${settlementAmount} (${settlementPercentage}%)`
      })
      alert('Loan settled and closed successfully')
      window.location.reload()
    } catch (err) {
      setError(err.response?.data?.message || 'Settlement failed')
    } finally {
      setSaving(false)
      setShowSettlement(false)
    }
  }

  const remainingBalance = data ? (data.installments || [])
    .filter(i => i.status === 'PENDING')
    .reduce((sum, i) => sum + (parseFloat(i.amount_due) - parseFloat(i.amount_paid || 0)), 0) : 0

  useEffect(() => {
    if (showSettlement) {
      setSettlementAmount(remainingBalance)
      setSettlementPercentage(100)
    }
  }, [showSettlement, remainingBalance])

  const handlePercentageChange = (p) => {
    setSettlementPercentage(p)
    setSettlementAmount(Math.round(remainingBalance * (p / 100)))
  }

  const handleDelete = async () => {
    if (!window.confirm('Permanent Delete? This action cannot be undone.')) return;
    setSaving(true);
    try {
      await api.delete(`/loans/${id}`);
      alert('Loan deleted successfully.');
      nav('/loans');
    } catch (e) {
      console.error('Delete error:', e);
      setError('Delete failed.');
    } finally {
      setSaving(false);
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const renderBorrower = () => (
    <div className="animate-in">
      <div className="section-header">Folio & Zone</div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Folio No.</label>
          <div style={{ display: 'flex', gap: 4 }}>
            <select className="form-control form-control--sm" style={{ width: 60 }} value={data.folio_prefix} onChange={set('folio_prefix')}>
              <option>O</option><option>S</option><option>KC</option>
            </select>
            <input className="form-control form-control--sm" value={data.folio_no} onChange={set('folio_no')} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Zone</label>
          <input className="form-control form-control--sm" list="zone-list" value={data.zone||''} onChange={set('zone')} />
          <datalist id="zone-list">
            {zones.map(z => <option key={z} value={z} />)}
          </datalist>
        </div>
      </div>

      <div className="section-header">Personal Details</div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-control form-control--sm" value={data.b_name} onChange={set('b_name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Father's Name</label>
          <input className="form-control form-control--sm" value={data.father_name} onChange={set('father_name')} />
        </div>
      </div>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <input className="form-control form-control--sm" value={data.mobile||''} onChange={set('mobile')} />
        </div>
        <div className="form-group">
          <label className="form-label">Aadhar No.</label>
          <input className="form-control form-control--sm" value={data.aadhar||''} onChange={set('aadhar')} />
        </div>
        <div className="form-group">
          <label className="form-label">PAN No.</label>
          <input className="form-control form-control--sm" value={data.pan||''} onChange={set('pan')} />
        </div>
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input type="date" className="form-control form-control--sm" value={data.dob||''} onChange={set('dob')} />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-control form-control--sm" value={data.address||''} onChange={set('address')} />
        </div>
      </div>
    </div>
  )

  const renderGuarantor = () => (
    <div className="animate-in">
      <div className="section-header">Guarantor Information</div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Guarantor Name</label>
          <input className="form-control form-control--sm" value={data.g_name} onChange={set('g_name')} />
        </div>
        <div className="form-group">
          <label className="form-label">Father's Name</label>
          <input className="form-control form-control--sm" value={data.g_father} onChange={set('g_father')} />
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Mobile</label>
          <input className="form-control form-control--sm" value={data.g_mobile} onChange={set('g_mobile')} />
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <input className="form-control form-control--sm" value={data.g_address} onChange={set('g_address')} />
        </div>
      </div>
    </div>
  )

  const renderVehicle = () => (
    <div className="animate-in">
      <div className="section-header">Vehicle Characteristics</div>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Condition / Sold By</label>
        <div style={{ display: 'flex', gap: 4 }}>
          <input className="form-control form-control--sm" style={{ width: 100 }} list="condition-list" value={data.v_condition} onChange={set('v_condition')} />
          <datalist id="condition-list">
            {(conditions || []).map(c => <option key={c} value={c} />)} 
          </datalist>
          <input className="form-control form-control--sm" value={data.v_sold_by} onChange={set('v_sold_by')} />
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Vehicle No.</label>
          <input className="form-control form-control--sm" value={data.v_no} onChange={set('v_no')} />
        </div>
        <div className="form-group">
          <label className="form-label">Model</label>
          <input className="form-control form-control--sm" value={data.v_model} onChange={set('v_model')} />
        </div>
      </div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input className="form-control form-control--sm" value={data.v_color} onChange={set('v_color')} />
        </div>
        <div className="form-group">
          <label className="form-label">Insurance Expiry</label>
          <input type="date" className="form-control form-control--sm" value={data.v_insurance ? data.v_insurance.slice(0,10) : ''} onChange={set('v_insurance')} />
        </div>
      </div>
      <div className="grid-3">
        <div className="form-group">
          <label className="form-label">Make Year</label>
          <input className="form-control form-control--sm" value={data.v_year} onChange={set('v_year')} />
        </div>
        <div className="form-group">
          <label className="form-label">Chassis No.</label>
          <input className="form-control form-control--sm" value={data.v_chassis} onChange={set('v_chassis')} />
        </div>
        <div className="form-group">
          <label className="form-label">Engine No.</label>
          <input className="form-control form-control--sm" value={data.v_engine} onChange={set('v_engine')} />
        </div>
      </div>
    </div>
  )

  const renderFinance = () => {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">Finance Amt</label>
              <input className="form-control form-control--sm" type="number" value={data.finance_amount} onChange={set('finance_amount')} />
            </div>
          </div>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">Rate (%)</label>
              <input className="form-control form-control--sm" type="number" value={data.interest_rate} onChange={set('interest_rate')} />
            </div>
          </div>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">Agreement Amt</label>
              <input className="form-control form-control--sm" type="number" value={data.agreement_amount} onChange={set('agreement_amount')} />
            </div>
          </div>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">HP / RTO</label>
              <input className="form-control form-control--sm" type="number" value={data.hire_purchase_rto} onChange={set('hire_purchase_rto')} />
            </div>
          </div>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">Months / Interval</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <input className="form-control form-control--sm" style={{ width: 60 }} type="number" value={data.total_months} onChange={set('total_months')} />
                <input className="form-control form-control--sm" style={{ width: 60 }} type="number" value={data.interval} onChange={set('interval')} />
              </div>
            </div>
          </div>
          <div className="card shadow-none" style={{ background: '#f8fafc', border: '1px solid var(--border)' }}>
            <div className="card-body" style={{ padding: 12 }}>
              <label className="form-label--xs">Agreement Date</label>
              <input className="form-control form-control--sm" type="date" value={data.agreement_date} onChange={set('agreement_date')} />
            </div>
          </div>
        </div>

        <div>
          <div className="section-header" style={{ marginBottom: 12 }}>Installment Schedule</div>
          <div style={{ 
            maxHeight: 400, overflowY: 'auto', border: '1px solid var(--border)', 
            borderRadius: 8, background: '#fff' 
          }} className="custom-scroll">
            <table className="table--high-density" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f9fafb', zIndex: 1, boxShadow: '0 1px 0 var(--border)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 16px' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px' }}>Due Date</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px' }}>Amount Due</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px' }}>Amount Paid</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.installments || []).map((ins, idx) => (
                  <tr key={ins.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 16px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 16px' }}>{fmtDate(ins.due_date)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 16px', fontWeight: 600 }}>₹{fmtCurrency(ins.amount_due)}</td>
                    <td style={{ textAlign: 'right', padding: '8px 16px', color: 'var(--success)', fontWeight: 600 }}>₹{fmtCurrency(ins.amount_paid)}</td>
                    <td style={{ textAlign: 'center', padding: '8px 16px' }}>
                      <span className={`badge badge--xs badge--${ins.status === 'PAID' ? 'success' : ins.status === 'SETTLED' ? 'primary' : 'warning'}`}>
                        {ins.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading-text"><Loader2 className="animate-spin" /> Loading Loan Details...</div>
  if (!data) return <div className="alert alert--error">{error || 'Loan not found.'}</div>

  const { gross, interest, total, emi } = calcLoan(
    data.finance_amount, data.agreement_amount, data.hire_purchase_rto,
    data.total_months, data.interest_rate
  )

  const totalDue = (data.installments || []).reduce((s, i) => s + toN(i.amount_due), 0)
  const totalPaid = (data.installments || []).reduce((s, i) => s + toN(i.amount_paid), 0)
  const remaining = totalDue - totalPaid

  return (
    <div className="loan-detail">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn--outline btn--sm" onClick={() => nav('/loans')} style={{ marginBottom: 8 }}>
            <ChevronLeft size={14} /> Back to Loans
          </button>
          <h1>Loan Detail: {data.b_name}</h1>
          <p>Folio: {data.folio_prefix}-{data.folio_no} | Status: <span className={`badge badge--${data.status === 'ACTIVE' ? 'primary' : 'gray'}`}>{data.status}</span></p>
        </div>
        <div className="action-bar-top" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="toggle-group" style={{ 
            display: 'flex', background: '#f3f4f6', padding: 3, borderRadius: 8, border: '1px solid var(--border)' 
          }}>
            <button 
              className={`toggle-btn ${viewMode === 'tabs' ? 'active' : ''}`}
              onClick={() => setViewMode('tabs')}
              style={{ padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Tabs View</button>
            <button 
              className={`toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
              style={{ padding: '4px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Full View</button>
          </div>
          <button className="btn btn--outline" onClick={handlePrint}>
            <Printer size={16} /> Print
          </button>
          <button className="btn btn--primary" onClick={handleUpdate} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="grid-2-alt" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {viewMode === 'tabs' ? (
              <>
                <div className="tabs-nav" style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#f9fafb' }}>
                  <button className={`tab-btn ${activeTab === 'borrower' ? 'active' : ''}`} onClick={() => setActiveTab('borrower')}>Borrower</button>
                  <button className={`tab-btn ${activeTab === 'guarantor' ? 'active' : ''}`} onClick={() => setActiveTab('guarantor')}>Guarantor</button>
                  <button className={`tab-btn ${activeTab === 'vehicle' ? 'active' : ''}`} onClick={() => setActiveTab('vehicle')}>Vehicle</button>
                  <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>Finance</button>
                </div>

                <div className="card-body" style={{ minHeight: 400 }}>
                  {activeTab === 'borrower' && renderBorrower()}
                  {activeTab === 'guarantor' && renderGuarantor()}
                  {activeTab === 'vehicle' && renderVehicle()}
                  {activeTab === 'finance' && renderFinance()}
                </div>
              </>
            ) : (
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {renderBorrower()}
                {renderGuarantor()}
                {renderVehicle()}
                {renderFinance()}
              </div>
            )}
          </div>
        </div>

        {/* Persistent Summary & Sticky Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <div className="card-header">Loan Overview</div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--primary-bg)', padding: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <label className="form-label--xs">Gross Amount</label>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>₹{fmtCurrency(gross)}</div>
                </div>

                <div className="grid-2" style={{ gap: 8 }}>
                  <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8 }}>
                    <label className="form-label--xs" style={{ color: 'var(--success)' }}>Total Paid</label>
                    <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: 14 }}>₹{fmtCurrency(totalPaid)}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: 10, borderRadius: 8 }}>
                    <label className="form-label--xs" style={{ color: 'var(--danger)' }}>Remaining</label>
                    <div style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>₹{fmtCurrency(remaining)}</div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: 8 }}>
                  <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <label className="form-label--xs">EMI</label>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>₹{fmtCurrency(emi * toN(data.interval || 1))}</div>
                  </div>
                  <div style={{ background: 'var(--surface)', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <label className="form-label--xs">Months</label>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{data.total_months}</div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button className="btn btn--warning btn--sm" style={{ flex: 1 }} onClick={() => handleStatusChange('SEIZED')} disabled={data.status === 'SEIZED'}>
                    <AlertTriangle size={14} /> Seized
                  </button>
                  <button className="btn btn--success btn--sm" style={{ flex: 1 }} onClick={() => setShowSettlement(true)} disabled={data.status === 'FINAL' || data.status === 'CLOSED'}>
                    <CheckSquare size={14} /> Final
                  </button>
                </div>
                
                <button className="btn btn--primary" style={{ width: '100%' }} onClick={handleUpdate} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button className="btn btn--outline btn--sm" style={{ width: '100%' }} onClick={() => setActiveTab('finance')}>
                  View Full Schedule
                </button>

                <button className="btn btn--outline btn--sm" style={{ width: '100%', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={handleDelete}>
                  <Trash2 size={14} /> Delete Loan Record
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettlement && (
        <div className="modal-overlay" style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="card animate-in-up" style={{ width: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: 16 }}>Final Settlement</h3>
            <div style={{ marginBottom: 16, padding: 12, background: '#fef3f2', borderRadius: 8, color: '#991b1b' }}>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Remaining Balance</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>₹{remainingBalance.toLocaleString()}</div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Settlement Percentage (%)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[100, 90, 80, 50].map(p => (
                  <button 
                    key={p} 
                    className={`btn btn--xs ${settlementPercentage === p ? 'btn--primary' : 'btn--outline'}`}
                    onClick={() => handlePercentageChange(p)}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Amount to Collect (₹)</label>
              <input 
                className="form-control" 
                type="number" 
                value={settlementAmount} 
                onChange={(e) => {
                  setSettlementAmount(e.target.value)
                  setSettlementPercentage(Math.round((e.target.value / remainingBalance) * 100))
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => setShowSettlement(false)}>Cancel</button>
              <button className="btn btn--success" style={{ flex: 1 }} onClick={handleSettle} disabled={loading}>
                {loading ? 'Processing...' : 'Settle Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .toggle-btn { transition: all .2s; color: var(--text-muted); background: transparent; }
        .toggle-btn.active { background: #fff !important; color: var(--primary) !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .tabs-nav { margin-bottom: 0; }
        .tab-btn { 
          flex: 1; padding: 12px; border: none; background: none; 
          font-size: 13px; font-weight: 600; color: var(--text-muted); 
          cursor: pointer; border-bottom: 2px solid transparent; 
          transition: all .2s; 
        }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: #fff; }
        .tab-btn:hover:not(.active) { background: #f3f4f6; }
        .tab-content { padding: 20px; }
        .animate-in { animation: fadeIn .3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

        @media print {
          .sidebar, .action-bar-top, .action-bar-bottom, .btn--outline, .tabs-nav { display: none !important; }
          .main-content { margin: 0 !important; }
          .card { border: none !important; box-shadow: none !important; }
          .form-control { border: none !important; padding: 0 !important; font-weight: 600; }
          .form-label { color: #000 !important; }
          body { font-size: 12pt; }
        }
      `}</style>
    </div>
  )
}

