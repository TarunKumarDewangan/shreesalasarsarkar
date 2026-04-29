import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import api from '../../api'

export default function DeleteLoanModal({ loan, onClose, onDeleted }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setConfirming(true); setError(null)
    try {
      await api.delete(`/loans/${loan.id}`)
      onDeleted()
    } catch (ex) {
      setError('Failed to delete this loan record.')
    } finally { setConfirming(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
          <h3>Confirm Record Deletion</h3>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            You are about to permanently delete this loan case. To avoid mistakes, please verify the following details:
          </p>
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>FOLIO NO:</span>
              <span className="td-mono" style={{ fontWeight: 800 }}>{loan.borrower?.folio_prefix}-{loan.borrower?.folio_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>BORROWER:</span>
              <span style={{ fontWeight: 700 }}>{loan.borrower?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>MOBILE:</span>
              <span style={{ fontWeight: 700 }}>{loan.borrower?.mobile || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>VEHICLE:</span>
              <span className="td-mono">{loan.borrower?.vehicle?.vehicle_no || 'N/A'}</span>
            </div>
          </div>
          {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}
          <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, marginTop: 12 }}>
            ⚠️ ALL linked installments, recovery records, and the borrower case entry will be removed. Personal details in "Personal Details" page will remain safe.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={confirming}>
            {confirming ? 'Deleting...' : 'Confirm Delete Case'}
          </button>
        </div>
      </div>
    </div>
  )
}
