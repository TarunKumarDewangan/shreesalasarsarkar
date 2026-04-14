import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { ChevronLeft, Save, Loader2, UserPlus } from 'lucide-react'

export default function BorrowerEntry() {
  const nav = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [folio, setFolio] = useState('')

  const [staff, setStaff] = useState([])
  const [zones, setZones] = useState([])
  const [form, setForm] = useState({
    recovery_man_id: '',
    folio_prefix: 'O',
    folio_no: '',
    zone: '',
    collection_date: new Date().toISOString().split('T')[0],
    name: '',
    father_name: '',
    mobile: '',
    mobile2: '',
    aadhar: '',
    pan: '',
    dob: '',
    address: '',
    g_name: '',
    g_father: '',
    g_mobile: '',
    g_address: ''
  })

  useEffect(() => {
    api.get('/borrowers/next-folio').then(r => {
      setFolio(r.data.next)
      setForm(f => ({ ...f, folio_no: r.data.next }))
    })
    api.get('/recovery-men').then(r => setStaff(r.data))
    api.get('/borrowers/zones').then(r => setZones(r.data))
  }, [])

  const set = k => e => {
    let val = e.target.value;
    const excluded = ['email', 'password', 'password_confirmation', 'current_password', 'new_password', 'username', 'user_name', 'access_token', 'instance_id'];
    if (!excluded.includes(k)) {
      val = val.toUpperCase();
    }
    setForm(f => ({ ...f, [k]: val }));
  }

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
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
      await api.post('/borrowers', body)
      alert('Borrower added successfully.')
      nav('/borrowers')
    } catch (ex) {
      setError(ex.response?.data?.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  return (
    <div className="legacy-entry-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn--outline btn--sm" onClick={() => nav(-1)} style={{ marginBottom: 8 }}>
            <ChevronLeft size={14} /> Back
          </button>
          <h1>Borrower Entry Segment</h1>
          <p>Register new borrower and guarantor</p>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <form className="card" style={{ padding: 20 }} onSubmit={handleSave}>
        <div style={{ margin: '0 0 16px', fontWeight: 700, color: 'var(--primary)', fontSize: 14, borderBottom: '2px solid var(--primary-bg)', paddingBottom: 4 }}>
          Borrower Identity
        </div>
        
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">Folio Prefix</label>
            <select className="form-control" value={form.folio_prefix} onChange={set('folio_prefix')}>
              <option value="O">O</option>
              <option value="S">S</option>
              <option value="KC">KC</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Folio No.</label>
            <input className="form-control" value={form.folio_no} onChange={set('folio_no')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Zone</label>
            <input className="form-control" list="be-zone-list" value={form.zone} onChange={set('zone')} />
            <datalist id="be-zone-list">
              {zones.map(z => <option key={z} value={z} />)}
            </datalist>
          </div>
        </div>

        <div style={{ margin: '12px 0 16px', fontWeight: 700, color: 'var(--primary)', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }}></div>
          <span>Recovery Assignment</span>
          <div style={{ height: 1, flex: 1, background: 'var(--border)' }}></div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Assign Recovery Executive</label>
            <select className="form-control" value={form.recovery_man_id} onChange={set('recovery_man_id')} style={{ fontWeight: 600, border: '2px solid var(--primary-bg)' }}>
              <option value="">-- No Assignment --</option>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Collection Day Schedule</label>
            <select className="form-control" value={form.collection_day} onChange={set('collection_day')} style={{ fontWeight: 600, border: '2px solid var(--primary-bg)' }}>
              <option value="">-- Set Day --</option>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Daily', 'Monthly'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-control" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Father / Husband Name</label>
            <input className="form-control" value={form.father_name} onChange={set('father_name')} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Primary Mobile</label>
            <input className="form-control" value={form.mobile} onChange={set('mobile')} />
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Mobile</label>
            <input className="form-control" value={form.mobile2} onChange={set('mobile2')} />
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Aadhar No.</label>
            <input className="form-control" value={form.aadhar} onChange={set('aadhar')} />
          </div>
          <div className="form-group">
            <label className="form-label">PAN No.</label>
            <input className="form-control" value={form.pan} onChange={set('pan')} />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-control" type="date" value={form.dob} onChange={set('dob')} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">Full Address</label>
          <textarea className="form-control" rows={2} value={form.address} onChange={set('address')} />
        </div>

        <div style={{ margin: '24px 0 16px', fontWeight: 700, color: 'var(--primary)', fontSize: 14, borderBottom: '2px solid var(--primary-bg)', paddingBottom: 4 }}>
          Guarantor Details
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Guarantor Name</label>
            <input className="form-control" value={form.g_name} onChange={set('g_name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Father Name</label>
            <input className="form-control" value={form.g_father} onChange={set('g_father')} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Mobile</label>
            <input className="form-control" value={form.g_mobile} onChange={set('g_mobile')} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-control" value={form.g_address} onChange={set('g_address')} />
          </div>
        </div>

        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Add Borrower & Guarantor'}
          </button>
        </div>
      </form>
    </div>
  )
}
