import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../../api'

export default function AssignmentModal({ borrower, staff, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      recovery_man_id: borrower.recovery_man_id || '',
      collection_date: borrower.collection_date || today
    }
  })
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/borrowers/${borrower.id}`, form)
      onSaved()
    } catch (ex) {
      alert('Failed to save assignment.')
    } finally { setSaving(false) }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Recovery Executive</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={save}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Recovery Executive</label>
              <select className="form-control" value={form.recovery_man_id} onChange={set('recovery_man_id')} required>
                <option value="">-- Select Agent --</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Collection Date</label>
              <input type="date" className="form-control" value={form.collection_date} onChange={set('collection_date')} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
