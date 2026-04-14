import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Edit2, Trash2, UserPlus, Shield, Smartphone, Mail, Lock, CheckCircle2, XCircle, Loader2, Search, User, MapPin, Phone, MoreVertical, ShieldCheck, ShieldAlert } from 'lucide-react'
import PremiumSearch from '../components/PremiumSearch'

export default function Staff() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const r = await api.get('/staff')
      setData(r.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (form) => {
    setSaving(true); setError('')
    try {
      if (form.id) await api.put(`/staff/${form.id}`, form)
      else await api.post('/staff', form)
      setModal(null)
      load()
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to save staff.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return
    try {
      await api.delete(`/staff/${id}`)
      load()
    } catch (e) { alert('Delete failed.') }
  }

  const filteredData = data.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.mobile?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Loader2 className="animate-spin text-primary" size={32} /></div>

  return (
    <div className="animate-in" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1>Recovery Directory</h1>
          <p>Manage your collection agents and system staff</p>
        </div>
        <button className="btn btn--primary" style={{ padding: '0 24px', height: 48, borderRadius: 12, fontWeight: 700, boxShadow: 'var(--shadow-md)' }} onClick={() => setModal({})}>
          <UserPlus size={18} style={{ marginRight: 8 }} /> Add Service Agent
        </button>
      </div>

      <div style={{ marginBottom: 32 }}>
         <PremiumSearch 
           placeholder="Search by name, mobile or email..." 
           onSearch={setSearch}
           results={filteredData}
           onSelect={(s) => setModal(s)}
         />
      </div>

      <div className="grid-3" style={{ gap: 24 }}>
          {filteredData.map(m => (
            <div key={m.id} className="card shadow-sm staff-card animate-in" style={{ borderRadius: 20, overflow: 'hidden', border: 'none', background: 'var(--card)' }}>
               <div style={{ padding: 24, paddingBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                     <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800 }}>
                        {m.name?.charAt(0).toUpperCase() || <User size={24} />}
                     </div>
                     <div className={`badge badge--${m.is_active ? 'success' : 'gray'}`} style={{ padding: '4px 12px', fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
                        {m.is_active ? 'ACTIVE' : 'INACTIVE'}
                     </div>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 800 }}>{m.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>
                     <Shield size={12} />
                     <span>Recovery Agent</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                           <Smartphone size={14} />
                        </div>
                        <span style={{ fontWeight: 600 }}>{m.mobile || 'No Mobile'}</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                           <Mail size={14} />
                        </div>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
                     </div>
                  </div>
               </div>

               <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>ID: #{m.id}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                     <button className="btn btn--white btn--sm" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={() => setModal(m)}>
                        <Edit2 size={14} />
                     </button>
                     <button className="btn btn--white btn--danger btn--sm" style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }} onClick={() => handleDelete(m.id)}>
                        <Trash2 size={14} />
                     </button>
                  </div>
               </div>
            </div>
          ))}
      </div>

      {filteredData.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px 0', background: 'var(--card)', borderRadius: 24 }}>
          <User size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
          <h3 style={{ opacity: 0.5 }}>No Service Agents Found</h3>
          <p style={{ opacity: 0.4, fontSize: 14 }}>Try adjusting your search or add a new member.</p>
        </div>
      )}

      {modal && (
        <StaffModal 
          staff={modal} 
          onSave={handleSave} 
          onClose={() => setModal(null)} 
          saving={saving} 
          error={error} 
        />
      )}
    </div>
  )
}

function StaffModal({ staff, onSave, onClose, saving, error }) {
  const [form, setForm] = useState({
    id: staff.id || null,
    name: staff.name || '',
    mobile: staff.mobile || '',
    email: staff.email || '',
    password: '',
    address: staff.address || '',
    is_active: typeof staff.is_active !== 'undefined' ? !!staff.is_active : true
  })

  const set = k => e => {
    let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const excluded = ['email', 'password', 'password_confirmation', 'current_password', 'new_password', 'username', 'user_name', 'access_token', 'instance_id'];
    if (typeof val === 'string' && !excluded.includes(k)) {
      val = val.toUpperCase();
    }
    setForm(f => ({ ...f, [k]: val }));
  }

  const sub = e => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal animate-in" style={{ maxWidth: 500, borderRadius: 24, overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
             </div>
             <div>
                <h3 style={{ margin: 0 }}>{form.id ? 'Refine Profile' : 'New Service Agent'}</h3>
                <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>Configure collection staff credentials</p>
             </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ background: 'var(--surface)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={18} /></button>
        </div>
        <form onSubmit={sub}>
          <div className="modal-body" style={{ padding: 32 }}>
            {error && <div className="alert alert--error" style={{ marginBottom: 24, borderRadius: 12, border: 'none' }}>{error}</div>}
            
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: 0.5 }}>FULL LEGAL NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                <input className="form-control" style={{ paddingLeft: 48, height: 48, borderRadius: 12, fontWeight: 600 }} value={form.name} onChange={set('name')} placeholder="e.g. RAJESH KUMAR" required />
              </div>
            </div>

            <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>MOBILE NUMBER</label>
                <div style={{ position: 'relative' }}>
                   <Phone size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                   <input className="form-control" style={{ paddingLeft: 42, height: 44, borderRadius: 12 }} value={form.mobile} onChange={set('mobile')} placeholder="10-digit mobile" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>LOGIN ACCESS</label>
                <div style={{ marginTop: 8 }}>
                  <label className="switch" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
                    <span className="slider round"></span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{form.is_active ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>LOGIN IDENTIFIER (EMAIL)</label>
              <div style={{ position: 'relative' }}>
                 <Mail size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                 <input className="form-control no-caps" style={{ paddingLeft: 42, height: 44, borderRadius: 12 }} type="email" value={form.email} onChange={set('email')} placeholder="staff@example.com" required />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{form.id ? 'RECOVERY PASSWORD (RESET)' : 'SYSTEM PASSWORD'}</label>
              <div style={{ position: 'relative' }}>
                 <Lock size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                 <input className="form-control" style={{ paddingLeft: 42, height: 44, borderRadius: 12 }} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required={!form.id} />
              </div>
              {form.id && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Ignore if password is not changing</p>}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>MAPPING & NOTES</label>
              <div style={{ position: 'relative' }}>
                 <MapPin size={16} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                 <textarea className="form-control" style={{ paddingLeft: 42, paddingTop: 12, borderRadius: 12 }} rows={3} value={form.address} onChange={set('address')} placeholder="Residential region or notes..." />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '20px 32px', background: 'var(--surface)', display: 'flex', gap: 16 }}>
            <button type="button" className="btn btn--white" style={{ flex: 1, height: 48, borderRadius: 12, fontWeight: 700 }} onClick={onClose}>Discard</button>
            <button type="submit" className="btn btn--primary" style={{ flex: 2, height: 48, borderRadius: 12, fontWeight: 800, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)' }} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={18} /> : (form.id ? 'Save Changes' : 'Confirm Registration')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
