import { useState } from 'react'
import { X, MessageCircle } from 'lucide-react'
import { fmtCurrency } from '../../utils'

export default function NotificationModal({ loan, onClose, onConfirm }) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const handleSend = async () => {
    setSending(true); setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (ex) {
      setError(ex.response?.data?.message || 'Failed to send WhatsApp notification.')
    } finally { setSending(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#25D366', color: '#fff', padding: 6, borderRadius: 8, display: 'flex' }}>
              <MessageCircle size={18}/>
            </div>
            <h3>Send WhatsApp</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Confirm sending a WhatsApp notification to <strong>{loan.borrower?.name}</strong> at <strong>{loan.borrower?.mobile}</strong>?
          </p>
          <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Folio:</span>
              <span className="td-mono">{loan.borrower?.folio_prefix}-{loan.borrower?.folio_no}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Amount:</span>
              <strong>₹{fmtCurrency(loan.gross_amount)}</strong>
            </div>
          </div>
          {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn--outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn--success" onClick={handleSend} disabled={sending} style={{ background: '#25D366', borderColor: '#25D366' }}>
            {sending ? 'Sending...' : 'Send WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}
