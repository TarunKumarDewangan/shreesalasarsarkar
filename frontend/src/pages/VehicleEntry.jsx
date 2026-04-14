import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import { ChevronLeft, Save, Loader2, Car } from 'lucide-react'

export default function VehicleEntry() {
  const { borrowerId } = useParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [borrowers, setBorrowers] = useState([])
  const [selectedB, setSelectedB] = useState(borrowerId || '')
  
  const [form, setForm] = useState({
    condition_type: 'NEW',
    vehicle_no: '',
    model: '',
    color: '',
    chassis_no: '',
    engine_no: '',
    make_year: '',
    sold_by: '',
    insurance_expiry: ''
  })

  useEffect(() => {
    api.get('/borrowers').then(r => setBorrowers(r.data.data || r.data))
    if (borrowerId) {
      setLoading(true)
      api.get(`/borrowers/${borrowerId}`).then(r => {
        if (r.data.vehicle) {
          setForm({
            ...r.data.vehicle,
            insurance_expiry: r.data.vehicle.insurance_expiry?.slice(0, 10) || ''
          })
        }
      }).finally(() => setLoading(false))
    }
  }, [borrowerId])

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
      if (!selectedB) throw new Error('Please select a borrower first.')
      await api.put(`/borrowers/${selectedB}`, { vehicle: form })
      alert('Vehicle details updated.')
      nav('/borrowers')
    } catch (ex) {
      setError(ex.response?.data?.message || ex.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="loading-text"><Loader2 className="animate-spin" /> Loading...</div>

  return (
    <div className="legacy-entry-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn btn--outline btn--sm" onClick={() => nav(-1)} style={{ marginBottom: 8 }}>
            <ChevronLeft size={14} /> Back
          </button>
          <h1>Vehicle Entry Segment</h1>
          <p>Dedicated vehicle detail management</p>
        </div>
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      <form className="card" style={{ padding: 20 }} onSubmit={handleSave}>
        {!borrowerId && (
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Select Borrower</label>
            <select className="form-control" value={selectedB} onChange={e => setSelectedB(e.target.value)}>
              <option value="">-- Choose Borrower --</option>
              {borrowers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.folio_no})</option>)}
            </select>
          </div>
        )}

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Condition</label>
            <select className="form-control" value={form.condition_type} onChange={set('condition_type')}>
              <option value="NEW">New Vehicle</option>
              <option value="USED">Used Vehicle</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">SOLD BY</label>
            <input className="form-control" value={form.sold_by} onChange={set('sold_by')} />
          </div>
        </div>

        <div className="grid-3" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Vehicle No.</label>
            <input className="form-control" value={form.vehicle_no} onChange={set('vehicle_no')} />
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input className="form-control" value={form.model} onChange={set('model')} />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input className="form-control" value={form.color} onChange={set('color')} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Chassis No.</label>
            <input className="form-control" value={form.chassis_no} onChange={set('chassis_no')} />
          </div>
          <div className="form-group">
            <label className="form-label">Engine No.</label>
            <input className="form-control" value={form.engine_no} onChange={set('engine_no')} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 12 }}>
          <div className="form-group">
            <label className="form-label">Make Year</label>
            <input className="form-control" type="number" value={form.make_year} onChange={set('make_year')} />
          </div>
          <div className="form-group">
            <label className="form-label">Insurance Expiry</label>
            <input className="form-control" type="date" value={form.insurance_expiry} onChange={set('insurance_expiry')} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn--primary btn--lg" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save Vehicle Details'}
          </button>
        </div>
      </form>
    </div>
  )
}
