import { useEffect, useState } from 'react'
import api from '../api'
import { 
  CheckCircle, ChevronRight, ChevronLeft, Save,
  Printer, Trash2, AlertTriangle, List, Image, PlusSquare, Loader2, Camera, X, Upload,
  User, Car, CreditCard, Users, Phone, ShieldCheck, MapPin, Calendar, Hash
} from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import { useAuth } from '../contexts/AuthContext'

/* ── helpers ─────────────────────────────── */
const toN = v => Number(v || 0)

function calcLoan(financeAmt, agreementAmt, hpRto, months, rate) {
  const gross    = toN(financeAmt) + toN(agreementAmt) + toN(hpRto)
  const interest = (gross * toN(rate) * toN(months)) / 1200
  const mathTotal = gross + interest
  const actualEmi = toN(months) > 0 ? mathTotal / toN(months) : 0
  const emi      = Math.ceil(actualEmi)
  // Total sum should be exactly the sum of installments
  const total    = emi * toN(months)
  return { gross, interest, total, emi, actualEmi, mathTotal }
}

async function compressImage(file, maxSizeKB = 100) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max resolution check to avoid huge canvases
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height *= maxDim / width;
            width = maxDim;
          } else {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Iterative compression
        while (base64.length / 1024 > maxSizeKB && quality > 0.1) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(base64);
      };
    };
  });
}

export default function CombinedEntry() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState({
    folio_prefix: 'O',
    folio_no: '',
    zone: '',
    financer_id: '',
    loan_type: 'CASH',
    // Borrower
    b_name: '',
    father_name: '',
    address: '',
    mobile: '',
    aadhar: '',
    pan: '',
    dob: '',
    // Guarantor
    g_name: '',
    g_father: '',
    g_mobile: '',
    g_address: '',
    // Vehicle
    v_condition: '',
    v_sold_by: '',
    v_model: '',
    v_color: '',
    v_chassis: '',
    v_engine: '',
    v_year: new Date().getFullYear(),
    v_no: '',
    v_insurance: '',
    agreement_date: new Date().toISOString().slice(0, 10),
    // Finance
    total_months: 12,
    interval: 1,
    finance_amount: '',
    agreement_amount: '',
    hire_purchase_rto: '',
    interest_rate: '',
    send_whatsapp: true,
    photo_base64: null,
    aadhar_photo_base64: null,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0: Borrower, 1: Vehicle, 2: Finance
  const [photoModal, setPhotoModal] = useState(false)

    const fetchMetadata = async (financerId = null) => {
      const params = financerId ? { financer_id: financerId } : {}
      try {
        const res = await api.get('/borrowers/onboarding-metadata', { params })
        const m = res.data;
        setData(d => ({ 
          ...d, 
          folio_no: m.next_folio,
          conditions: m.conditions || [],
          sold_by_list: m.sold_by || [],
          models: m.models || [],
          colors: m.colors || [],
          zones: m.zones || [],
          financers: m.financers?.length ? m.financers : d.financers, // Update financers only if provided
          financer_id: (m.financers?.length === 1 && !d.financer_id) ? m.financers[0].id : d.financer_id
        }))
      } catch (e) { 
        console.error('Metadata fetch failed', e) 
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      if (data.financer_id) {
        fetchMetadata(data.financer_id)
      }
    }, [data.financer_id])

    useEffect(() => {
      fetchMetadata()
    }, [])

  const set = k => e => {
    let val = e.target.value;
    const excluded = ['email', 'password', 'password_confirmation', 'current_password', 'new_password', 'username', 'user_name', 'access_token', 'instance_id'];
    if (!excluded.includes(k)) {
      val = val.toUpperCase();
    }
    setData(d => ({ ...d, [k]: val }));
    if (error) setError(''); // Clear error on change
  }

  const handleReset = () => {
    if (!confirm('Clear all fields and start new entry?')) return
    setData(d => ({
      ...d,
      b_name: '', address: '', mobile: '', aadhar: '', pan: '', dob: '',
      g_name: '', g_father: '', g_mobile: '', g_address: '',
      v_no: '', v_chassis: '', v_engine: '', v_insurance: '',
      finance_amount: '', agreement_amount: '', hire_purchase_rto: ''
    }))
    setActiveTab(0)
  }

  const { gross, interest, total, emi, actualEmi, mathTotal } = calcLoan(
    data.finance_amount, data.agreement_amount, data.hire_purchase_rto,
    data.total_months, data.interest_rate
  )

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const borrowerBody = {
        folio_prefix: data.folio_prefix,
        folio_no: String(data.folio_no),
        zone: String(data.zone || ''),
        name: String(data.b_name || ''),
        father_name: String(data.father_name || ''),
        mobile: String(data.mobile || ''),
        aadhar: data.aadhar,
        pan: data.pan,
        dob: data.dob,
        address: data.address,
        financer_id: data.financer_id || undefined,
        guarantor: data.g_name ? {
          name: data.g_name,
          father_name: data.g_father,
          mobile: data.g_mobile,
          address: data.g_address
        } : null,
        vehicle: {
          condition_type: String(data.v_condition || ''),
          sold_by: String(data.v_sold_by || ''),
          model: String(data.v_model || ''),
          color: String(data.v_color || ''),
          chassis_no: String(data.v_chassis || ''),
          engine_no: String(data.v_engine || ''),
          make_year: String(data.v_year || ''),
          vehicle_no: String(data.v_no || ''),
          insurance_expiry: data.v_insurance || null
        },
        photo_base64: data.photo_base64,
        aadhar_photo_base64: data.aadhar_photo_base64
      }

      const bRes = await api.post('/borrowers', borrowerBody)
      const borrower_id = bRes.data.id

      const loanBody = {
        borrower_id,
        type: data.loan_type,
        agreement_date: data.agreement_date,
        finance_amount:   Number(data.finance_amount),
        agreement_amount: Number(data.agreement_amount || 0),
        hire_purchase_rto:Number(data.hire_purchase_rto || 0),
        total_months:     Number(data.total_months),
        interval:         Number(data.interval || 1),
        interest_rate:    Number(data.interest_rate),
        status:           'ACTIVE',
        send_whatsapp:    data.send_whatsapp
      }
      await api.post('/loans', loanBody)
      setSuccess(true)
      
      // Auto fetch next folio and clear data after success
      setTimeout(async () => {
        const fRes = await api.get('/borrowers/next-folio')
        setData(d => ({
          ...d,
          folio_no: fRes.data.next,
          b_name: '', address: '', mobile: '', aadhar: '', pan: '', dob: '',
          g_name: '', g_father: '', g_mobile: '', g_address: '',
          v_no: '', v_chassis: '', v_engine: '', v_insurance: '',
          finance_amount: '', agreement_amount: '', hire_purchase_rto: ''
        }))
        setSuccess(false)
        setActiveTab(0)
      }, 3000)
    } catch (ex) {
      console.error('Save failed', ex)
      let msg = ex.response?.data?.message || ex.message || 'Save failed.'
      
      // Detailed validation errors
      if (ex.response?.status === 422 && ex.response?.data?.errors) {
        const errors = ex.response.data.errors
        const errorList = Object.values(errors).flat()
        if (errorList.length > 0) {
          msg = `Validation Error: ${errorList.join(' ')}`
        }
      }
      
      setError(msg)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="loading-text"><Loader2 className="animate-spin" /> Initializing legacy entry system...</div>

  return (
    <div className="new-entry">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1>Borrower Onboarding</h1>
          <p>Create new loan record with combined entry flow</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Main Form Area */}
        <div className="main-entry-form" style={{ flex: 1 }}>
          <div className="card" style={{ padding: '0px' }}>
            {/* Tabs Navigation */}
            <div className="tabs-nav" style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: '#f9fafb' }}>
              <button className={`tab-btn ${activeTab === 0 ? 'active' : ''}`} onClick={() => setActiveTab(0)}>1. Borrower & Guarantor</button>
              <button className={`tab-btn ${activeTab === 1 ? 'active' : ''}`} onClick={() => setActiveTab(1)}>2. Vehicle Details</button>
              <button className={`tab-btn ${activeTab === 2 ? 'active' : ''}`} onClick={() => setActiveTab(2)}>3. Finance & Agreement</button>
            </div>

            <div style={{ padding: '16px' }}>
              {activeTab === 0 && (
                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div className="section-header">Folio & Zone</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Folio No.</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <select className="form-control form-control--sm" style={{ width: 60 }} value={data.folio_prefix} onChange={set('folio_prefix')}>
                            <option>O</option><option>S</option><option>KC</option>
                          </select>
                          <input className="form-control form-control--sm" style={{ flex: 1, fontWeight: 700 }} value={data.folio_no} onChange={set('folio_no')} />
                        </div>
                      </div>
                      <div className="entry-card">
                        <label>Zone</label>
                        <input className="form-control form-control--sm" list="zone-list" value={data.zone} onChange={set('zone')} />
                        <datalist id="zone-list">
                          {(data.zones || []).map(z => <option key={z} value={z} />)}
                        </datalist>
                      </div>
                      <div className="entry-card">
                        <label>Dealer / Financer</label>
                        <select className="form-control form-control--sm" value={data.financer_id} onChange={set('financer_id')} disabled={!isAdmin && (data.financers || []).length <= 1}>
                          <option value="">Select Dealer</option>
                          {(data.financers || []).map(f => (
                            <option key={f.id} value={f.id}>{f.finance_name || f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="entry-card">
                        <label>Loan Type</label>
                        <select className="form-control form-control--sm" value={data.loan_type} onChange={set('loan_type')}>
                          <option value="CASH">CASH</option>
                          <option value="BANK">BANK</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="section-header">Borrower Details</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Full Name</label>
                        <input className="form-control form-control--sm" value={data.b_name} onChange={set('b_name')} />
                      </div>
                      <div className="entry-card">
                        <label>Father's Name</label>
                        <input className="form-control form-control--sm" value={data.father_name} onChange={set('father_name')} />
                      </div>
                      <div className="entry-card">
                        <label>Mobile Number</label>
                        <input className="form-control form-control--sm" value={data.mobile} onChange={set('mobile')} />
                      </div>
                      <div className="entry-card" style={{ gridColumn: 'span 1' }}>
                        <label>Date of Birth</label>
                        <input type="date" className="form-control form-control--sm" value={data.dob} onChange={set('dob')} />
                      </div>
                    </div>
                    <div className="entry-card" style={{ marginTop: 16 }}>
                      <label>Residential Address</label>
                      <textarea className="form-control form-control--sm" rows={2} value={data.address} onChange={set('address')} />
                    </div>
                  </div>

                  <div>
                    <div className="section-header">Guarantor Details</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Guarantor Name</label>
                        <input className="form-control form-control--sm" value={data.g_name} onChange={set('g_name')} />
                      </div>
                      <div className="entry-card">
                        <label>Father's Name</label>
                        <input className="form-control form-control--sm" value={data.g_father} onChange={set('g_father')} />
                      </div>
                      <div className="entry-card">
                        <label>Mobile Number</label>
                        <input className="form-control form-control--sm" value={data.g_mobile} onChange={set('g_mobile')} />
                      </div>
                      <div className="entry-card">
                        <label>Address</label>
                        <input className="form-control form-control--sm" value={data.g_address} onChange={set('g_address')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div className="section-header">Vehicle Specs</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Condition</label>
                        <input className="form-control form-control--sm" list="condition-list" value={data.v_condition} onChange={set('v_condition')} placeholder="NEW / USED" />
                        <datalist id="condition-list">
                          <option value="NEW" /><option value="USED" />
                        </datalist>
                      </div>
                      <div className="entry-card">
                        <label>Sold By (Dealer)</label>
                        <input className="form-control form-control--sm" list="sold-by-list" value={data.v_sold_by} onChange={set('v_sold_by')} />
                        <datalist id="sold-by-list">
                          {(data.sold_by_list || []).map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      <div className="entry-card">
                        <label>Model</label>
                        <input className="form-control form-control--sm" list="model-list" value={data.v_model} onChange={set('v_model')} />
                        <datalist id="model-list">
                          {(data.models || []).map(m => <option key={m} value={m} />)}
                        </datalist>
                      </div>
                      <div className="entry-card">
                        <label>Color</label>
                        <input className="form-control form-control--sm" list="color-list" value={data.v_color} onChange={set('v_color')} />
                        <datalist id="color-list">
                          {(data.colors || []).map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="section-header">Identification</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Chassis No.</label>
                        <input className="form-control form-control--sm" value={data.v_chassis} onChange={set('v_chassis')} />
                      </div>
                      <div className="entry-card">
                        <label>Engine No.</label>
                        <input className="form-control form-control--sm" value={data.v_engine} onChange={set('v_engine')} />
                      </div>
                      <div className="entry-card">
                        <label>Make Year</label>
                        <input className="form-control form-control--sm" type="number" value={data.v_year} onChange={set('v_year')} />
                      </div>
                      <div className="entry-card">
                        <label>Vehicle No.</label>
                        <input className="form-control form-control--sm" value={data.v_no} onChange={set('v_no')} />
                      </div>
                      <div className="entry-card">
                        <label>Insurance Expiry</label>
                        <input type="date" className="form-control form-control--sm" value={data.v_insurance} onChange={set('v_insurance')} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <div className="section-header">Financial Terms</div>
                    <div className="entry-grid">
                      <div className="entry-card">
                        <label>Agreement Date</label>
                        <input type="date" className="form-control form-control--sm" value={data.agreement_date} onChange={set('agreement_date')} />
                      </div>
                      <div className="entry-card">
                        <label>Months / Interval</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input className="form-control form-control--sm" style={{ width: 60 }} type="number" value={data.total_months} onChange={set('total_months')} />
                          <input className="form-control form-control--sm" style={{ width: 60 }} type="number" value={data.interval} onChange={set('interval')} />
                        </div>
                      </div>
                      <div className="entry-card">
                        <label>Finance Amount</label>
                        <input className="form-control form-control--sm" type="number" value={data.finance_amount} onChange={set('finance_amount')} />
                      </div>
                      <div className="entry-card">
                        <label>Interest Rate (%)</label>
                        <input className="form-control form-control--sm" type="number" value={data.interest_rate} onChange={set('interest_rate')} />
                      </div>
                      <div className="entry-card">
                        <label>Agreement Amount</label>
                        <input className="form-control form-control--sm" type="number" value={data.agreement_amount} onChange={set('agreement_amount')} />
                      </div>
                      <div className="entry-card">
                        <label>Hire Purchase / RTO</label>
                        <input className="form-control form-control--sm" type="number" value={data.hire_purchase_rto} onChange={set('hire_purchase_rto')} />
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--primary-bg)', padding: 20, borderRadius: 12, border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                    <div className="grid-2" style={{ gap: 20 }}>
                      <div>
                        <label className="form-label--xs" style={{ color: 'var(--text-muted)' }}>GROSS AMOUNT</label>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>₹{fmtCurrency(gross)}</div>
                      </div>
                      <div>
                        <label className="form-label--xs" style={{ color: 'var(--text-muted)' }}>TOTAL CONTRACT SUM</label>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>₹{fmtCurrency(total)}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, color: '#64748b', fontWeight: 600 }}>Actual: ₹{mathTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 16, background: '#fff', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>WhatsApp Summary</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notify borrower on submission</div>
                      </div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={data.send_whatsapp} onChange={e => setData(d => ({ ...d, send_whatsapp: e.target.checked }))} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              )}

              {/* Tab Navigation Buttons */}
              <div className="tab-actions" style={{ display: 'flex', gap: 8, marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                {activeTab > 0 && (
                  <button className="btn btn--outline" onClick={() => setActiveTab(activeTab - 1)}>
                    <ChevronLeft size={16} /> Previous
                  </button>
                )}
                <div style={{ flex: 1 }} />
                {activeTab < 2 ? (
                  <button className="btn btn--primary" onClick={() => setActiveTab(activeTab + 1)}>
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button className="btn btn--success btn--lg" onClick={handleSave} disabled={saving || success}>
                    <Save size={16} /> {saving ? 'Saving...' : success ? 'Saved!' : 'Final Submission'}
                  </button>
                )}
              </div>
            </div>

            {/* Modern Action Bar */}
            <div className="modern-action-bar" style={{ 
              padding: '16px 24px', 
              background: '#fff', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              <button className="btn btn--outline" onClick={() => setPhotoModal(true)}>
                <Camera size={18} /> {data.photo_base64 || data.aadhar_photo_base64 ? 'Manage Photos' : 'Photo / ID'}
              </button>
              <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
              <button className="btn btn--outline" onClick={() => window.location.reload()}>
                <PlusSquare size={18} /> New Entry
              </button>
              <button className="btn btn--outline" onClick={() => window.location.href='/loans'}>
                <List size={18} /> Loan List
              </button>
              <button className="btn btn--danger" style={{ marginLeft: 'auto' }} onClick={handleReset}>
                <Trash2 size={18} /> Reset Form
              </button>
            </div>
          </div>
        </div>

        {/* Live Tracking Sidebar (Right) */}
        <div className="entry-sidebar">
          <div className="card hub-card shadow-lg">
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '16px' }}>
              <div className="hub-label" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Submission Hub</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Live Preview</div>
            </div>

            <div className="hub-section">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <User size={14} className="text-primary" />
                <div className="hub-label" style={{ margin: 0 }}>Borrower</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{data.b_name || '...'}</div>
              <div className="hub-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> Mobile</span>
                <span>{data.mobile || '...'}</span>
              </div>
              <div className="hub-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} /> Zone</span>
                <span>{data.zone || '...'}</span>
              </div>
              <div className="hub-row" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={10} /> Folio</span>
                <span>{data.folio_prefix}-{data.folio_no}</span>
              </div>
            </div>

            {data.g_name && (
              <div className="hub-section animate-in">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <ShieldCheck size={14} className="text-primary" />
                  <div className="hub-label" style={{ margin: 0 }}>Guarantor</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{data.g_name}</div>
                <div className="hub-row">
                  <span>Mobile</span>
                  <span>{data.g_mobile || '...'}</span>
                </div>
              </div>
            )}

            <div className="hub-section">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Car size={14} className="text-primary" />
                <div className="hub-label" style={{ margin: 0 }}>Vehicle</div>
              </div>
              <div className="hub-row">
                <span>Model</span>
                <span>{data.v_model || '...'}</span>
              </div>
              <div className="hub-row">
                <span>Number</span>
                <span>{data.v_no || '...'}</span>
              </div>
              {data.v_chassis && (
                <div className="hub-row">
                  <span>Chassis</span>
                  <span>{data.v_chassis}</span>
                </div>
              )}
            </div>

            <div className="hub-section">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <CreditCard size={14} className="text-primary" />
                <div className="hub-label" style={{ margin: 0 }}>Finance</div>
              </div>
              <div className="hub-row">
                <span>Principal</span>
                <span>₹{fmtCurrency(data.finance_amount)}</span>
              </div>
              <div className="hub-row">
                <span>Tenure</span>
                <span>{data.total_months} Months</span>
              </div>
              <div className="hub-row">
                <span>Rate</span>
                <span>{data.interest_rate}% p.a.</span>
              </div>
              <div className="hub-row" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                <span>EMI</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{fmtCurrency(emi * toN(data.interval || 1))}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, color: '#64748b' }}>Actual: ₹{(actualEmi * toN(data.interval || 1)).toFixed(3)}</div>
                </div>
              </div>
              <div className="hub-row">
                <span style={{ fontSize: 14 }}>Total Sum</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 800 }}>₹{fmtCurrency(total)}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, color: '#64748b' }}>Actual: ₹{mathTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: 16, background: '#fef2f2', borderTop: '1px solid #fee2e2' }}>
                <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>Submission Error</div>
                <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>{error}</div>
              </div>
            )}

            <div style={{ padding: 16, background: '#f9fafb' }}>
              {success ? (
                <div className="alert alert--success" style={{ margin: 0, padding: 10, fontSize: 12 }}>
                  <CheckCircle size={14} /> Record Saved!
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {saving ? 'Processing submission...' : 'Review details and submit'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {photoModal && (
        <div className="modal-backdrop">
          <div className="modal animate-in" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Borrower Identification</h3>
              <button className="btn-close" onClick={() => setPhotoModal(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Borrower Photo */}
                <div>
                  <label className="section-header" style={{ marginBottom: 12 }}>Borrower Photo</label>
                  <div className="photo-upload-box" onClick={() => document.getElementById('photo-input').click()}>
                    {data.photo_base64 ? (
                      <img src={data.photo_base64} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div className="upload-placeholder">
                        <Camera size={32} opacity={0.3} />
                        <span>Click to Capture</span>
                      </div>
                    )}
                  </div>
                  <input id="photo-input" type="file" accept="image/*" hidden onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const compressed = await compressImage(file);
                      setData(d => ({ ...d, photo_base64: compressed }));
                    }
                  }} />
                  {data.photo_base64 && (
                    <button className="btn btn--danger btn--sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setData(d => ({ ...d, photo_base64: null }))}>
                      Remove
                    </button>
                  )}
                </div>

                {/* Aadhar Photo */}
                <div>
                  <label className="section-header" style={{ marginBottom: 12 }}>Aadhar Card</label>
                  <div className="photo-upload-box" onClick={() => document.getElementById('aadhar-input').click()}>
                    {data.aadhar_photo_base64 ? (
                      <img src={data.aadhar_photo_base64} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div className="upload-placeholder">
                        <Upload size={32} opacity={0.3} />
                        <span>Upload Aadhar</span>
                      </div>
                    )}
                  </div>
                  <input id="aadhar-input" type="file" accept="image/*" hidden onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const compressed = await compressImage(file);
                      setData(d => ({ ...d, aadhar_photo_base64: compressed }));
                    }
                  }} />
                  {data.aadhar_photo_base64 && (
                    <button className="btn btn--danger btn--sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setData(d => ({ ...d, aadhar_photo_base64: null }))}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: '12px', background: '#f0f9ff', borderRadius: 8, fontSize: 12, color: '#0369a1', display: 'flex', gap: 8 }}>
                <CheckCircle size={16} />
                <span>Images are automatically compressed to ~100KB for maximum performance.</span>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid var(--border)', justifyContent: 'flex-end' }}>
              <button className="btn btn--primary" style={{ width: '100%' }} onClick={() => setPhotoModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .new-entry { width: 100%; animate-in: fadeIn 0.4s ease-out; }
        .section-header { font-size: 13px; font-weight: 700; color: var(--primary); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .section-header::after { content: ''; flex: 1; height: 1px; background: var(--border); opacity: 0.5; }
        
        .entry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .entry-card { background: #f8fafc; border: 1px solid var(--border); border-radius: 8px; padding: 12px; transition: all 0.2s; }
        .entry-card:focus-within { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .entry-card label { display: block; font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .hub-card { position: sticky; top: 24px; padding: 0; overflow: hidden; }
        .hub-section { padding: 16px; border-bottom: 1px solid var(--border); }
        .hub-section:last-child { border-bottom: none; }
        .hub-label { font-size: 10px; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
        .hub-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
        .hub-row span:first-child { color: var(--text-muted); font-size: 12px; }
        .hub-row span:last-child { font-weight: 700; }
        
        .tabs-nav { display: flex; border-bottom: 1px solid var(--border); background: #f9fafb; padding: 0 8px; }
        .tab-btn { padding: 14px 20px; border: none; background: none; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; opacity: 0.7; }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: #fff; opacity: 1; }
        .tab-btn:hover:not(.active) { opacity: 1; background: #f1f5f9; }
        
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .photo-upload-box {
          aspect-ratio: 3/4;
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-upload-box:hover {
          border-color: var(--primary);
          background: #f8fafc;
        }
        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 13px;
        }
        
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
      `}</style>
    </div>
  )
}
