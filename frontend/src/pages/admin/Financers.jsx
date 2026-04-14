import { useEffect, useState } from 'react'
import api from '../../api'
import { PlusCircle, Edit2, Trash2, X, Building2 } from 'lucide-react'

const empty = { name:'', owner_name:'', finance_name:'', mobile:'', email:'', password:'', address:'' }

function FinancerModal({ financer, onClose, onSaved }) {
  const isEdit = !!financer?.id
  const [form, setForm] = useState(isEdit ? { ...financer, password:'' } : { ...empty })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = k => e => {
    let val = e.target.value;
    const excluded = ['email', 'password', 'password_confirmation', 'current_password', 'new_password', 'username', 'user_name', 'name', 'access_token', 'instance_id'];
    // NOTE: 'name' is excluded here because in this context it refers to "Login Name (Username)"
    if (!excluded.includes(k)) {
      val = val.toUpperCase();
    }
    setForm(f => ({ ...f, [k]: val }));
  }

  const save = async e => {
    e.preventDefault(); setErr(''); setSaving(true)
    try {
      if (isEdit) await api.put(`/financers/${financer.id}`, form)
      else         await api.post('/financers', form)
      onSaved()
    } catch (ex) {
      const msgs = ex.response?.data?.errors
        ? Object.values(ex.response.data.errors).flat().join(', ')
        : ex.response?.data?.message || 'Save failed.'
      setErr(msgs)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Financer' : 'Add Financer'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            {err && <div className="alert alert--error">{err}</div>}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Login Name (Username) *</label>
                <input className="form-control" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-control" value={form.owner_name||''} onChange={set('owner_name')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Finance / Branch Name</label>
              <input className="form-control" value={form.finance_name||''} onChange={set('finance_name')} placeholder="e.g. Salasar Finance Raipur" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input className="form-control" value={form.mobile||''} onChange={set('mobile')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-control" type="email" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input className="form-control" type="password" value={form.password} onChange={set('password')}
                required={!isEdit} minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={2} value={form.address||''} onChange={set('address')} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create Financer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Financers() {
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // null | 'add' | 'delete' | financer
  const [target, setTarget] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/financers').then(r => setList(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const del = async id => {
    try {
      setDeletingId(id)
      await api.delete(`/financers/${id}`)
      setModal(null)
      load()
    } catch (ex) {
      console.error('Delete failed', ex)
      alert(ex.response?.data?.message || 'Failed to delete financer.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Financer Management</h1>
        <p>Admin panel — create and manage finance branches</p>
      </div>

      <div className="card">
        <div className="toolbar" style={{ padding:'16px 20px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--text-muted)', fontSize:13 }}>
            <Building2 size={16}/> {list.length} financer(s)
          </div>
          <div className="toolbar-spacer"/>
          <button className="btn btn--primary" onClick={() => setModal('add')}>
            <PlusCircle size={15}/> Add Financer
          </button>
        </div>

        {loading ? <p className="loading-text">Loading…</p> : (
          <div className="table-wrap" style={{ marginTop:16 }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Login Name</th>
                  <th>Owner Name</th>
                  <th>Finance Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={7} className="loading-text">No financers yet.</td></tr>
                ) : list.map((f, i) => (
                  <tr key={f.id}>
                    <td>{i+1}</td>
                    <td><strong>{f.name}</strong></td>
                    <td>{f.owner_name||'—'}</td>
                    <td>{f.finance_name||'—'}</td>
                    <td>{f.mobile||'—'}</td>
                    <td>{f.email}</td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn--outline btn--sm" onClick={() => setModal(f)}>
                          <Edit2 size={13}/> Edit
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => { setTarget(f); setModal('delete'); }} disabled={deletingId === f.id}>
                          <Trash2 size={13}/> {deletingId === f.id ? '...' : ''}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'add' || (modal && typeof modal === 'object' && modal !== 'delete')) && (
        <FinancerModal
          financer={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}

      {modal === 'delete' && target && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
            <div style={{ width: 64, height: 64, background: '#fee2e2', color: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={32} />
            </div>
            <h2 style={{ marginBottom: 8, fontSize: 20 }}>Delete Financer?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Are you sure you want to delete <strong>{target.finance_name || target.name}</strong>? 
              <br/><br/>
              <span style={{ color: '#dc2626', fontWeight: 600 }}>WARNING:</span> All associated Loans, Borrowers, and Installments will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn--outline" style={{ flex: 1 }} onClick={() => setModal(null)} disabled={deletingId}>
                Cancel
              </button>
              <button className="btn btn--danger" style={{ flex: 1 }} onClick={() => del(target.id)} disabled={deletingId}>
                {deletingId ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
