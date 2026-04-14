import { useState, useEffect } from 'react'
import { X, Calendar, Calculator, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import api from '../api'

export default function PayModal({ installment, allInstallments = [], onPay, onClose, isStaff = false }) {
  const [modes, setModes] = useState([])
  const [form, setForm] = useState({ 
    paid_date: new Date().toISOString().slice(0, 10), 
    penalty: '', 
    discount: '', 
    method: 'CASH', 
    notes: '',
    receipt_no: '',
    is_manual_receipt: false,
    send_whatsapp: true
  })

  useEffect(() => {
    api.get('/payment-methods').then(r => {
      const active = r.data.filter(m => m.is_active)
      setModes(active)
      if (active.length > 0 && !active.find(m => m.name === 'CASH')) {
         setForm(f => ({ ...f, method: active[0].name }))
      }
    })
  }, [])
  const [delay, setDelay] = useState({ days: 0, fine: 0 })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    if (!installment?.due_date || !form.paid_date) return

    const due = new Date(installment.due_date)
    const paid = new Date(form.paid_date)
    
    due.setHours(0,0,0,0)
    paid.setHours(0,0,0,0)

    const diffTime = paid - due
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      const fine = diffDays * 10
      setDelay({ days: diffDays, fine })
      setForm(f => ({ ...f, penalty: fine.toString() }))
    } else {
      setDelay({ days: 0, fine: 0 })
      setForm(f => ({ ...f, penalty: '' }))
    }
  }, [form.paid_date, installment?.due_date])

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    const payload = { ...form }
    if (!form.is_manual_receipt) delete payload.receipt_no
    delete payload.is_manual_receipt

    try { await onPay(payload) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1000, width: '95vw', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr' : 'minmax(400px, 1.2fr) 1fr', minHeight: 500 }}>
          
          {/* Left Side: Ledger View */}
          {!isStaff && (
          <div style={{ background: '#f8fafc', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Loan Installment Ledger</h4>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Quick reference of overall payment history</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <table className="table--high-density" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <th style={{ fontSize: 10, padding: 8 }}>#</th>
                    <th style={{ fontSize: 10, padding: 8 }}>DUE DATE</th>
                    <th style={{ fontSize: 10, padding: 8 }}>EMI</th>
                    <th style={{ fontSize: 10, padding: 8 }}>STATUS</th>
                    <th style={{ fontSize: 10, padding: 8 }}>PAID ON</th>
                  </tr>
                </thead>
                <tbody>
                  {allInstallments.map((ins, idx) => (
                    <tr key={ins.id} style={{ 
                      background: ins.id === installment.id ? 'var(--primary-bg)' : '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      borderRadius: 6
                    }}>
                      <td style={{ padding: '8px', borderTopLeftRadius: 6, borderBottomLeftRadius: 6, fontSize: 11, fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '8px', fontSize: 11, fontWeight: 500 }}>{fmtDate(ins.due_date)}</td>
                      <td style={{ padding: '8px', fontSize: 11, fontWeight: 700 }}>₹{fmtCurrency(ins.amount_due)}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`badge badge--${ins.status === 'PAID' ? 'success' : 'warning'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                          {ins.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', borderTopRightRadius: 6, borderBottomRightRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        {ins.paid_date ? fmtDate(ins.paid_date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Right Side: Payment Form */}
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: isStaff ? 600 : 'auto', margin: isStaff ? '0 auto' : 0, width: isStaff ? '100%' : 'auto' }}>
            <div className="modal-header" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mark Paid</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entry for installment #{allInstallments.findIndex(i => i.id === installment.id) + 1}</p>
                </div>
              </div>
              <button className="modal-close" onClick={onClose}><X size={20} /></button>
            </div>

            <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="modal-body" style={{ padding: '24px', flex: 1 }}>
                
                {/* Due Info Card */}
                <div style={{ padding: 16, background: 'linear-gradient(135deg, #fff 0%, #f8faff 100%)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</label>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{fmtDate(installment.due_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Due</label>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>₹{fmtCurrency(installment.amount_due)}</div>
                    </div>
                  </div>
                  
                  {delay.days > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                      <Clock size={14} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Delayed by {delay.days} Days</span>
                      <span style={{ fontSize: 11, background: 'var(--danger-bg)', padding: '2px 6px', borderRadius: 4 }}>₹10/day Fine Calculated</span>
                    </div>
                  )}
                </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Payment Date *</label>
                      <input className="form-control" type="date" value={form.paid_date} onChange={set('paid_date')} required disabled={isStaff} />
                    </div>
                  <div className="form-group">
                    <label className="form-label">Penalty / Late Fine (₹)</label>
                    <input className="form-control" style={{ fontWeight: 700, color: delay.days > 0 ? 'var(--danger)' : 'inherit' }} type="number" min="0" step="0.01" value={form.penalty} onChange={set('penalty')} placeholder={delay.fine > 0 ? `Auto: ${delay.fine}` : '0'} />
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input className="form-control" type="number" min="0" step="0.01" value={form.discount} onChange={set('discount')} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method *</label>
                    {!form.is_custom_method ? (
                      <select 
                        className="form-control" 
                        value={form.method} 
                        onChange={(e) => {
                          if (e.target.value === '___CUSTOM___') {
                            setForm(f => ({ ...f, method: '', is_custom_method: true }))
                          } else {
                            setForm(f => ({ ...f, method: e.target.value }))
                          }
                        }}
                      >
                        {/* Merge defaults with DB modes */}
                        {Array.from(new Set([
                          'CASH', 'ONLINE', 'GPAY', 'PHONEPE', 'UPI', 'BANK TRANSFER', 'CHEQUE',
                          ...modes.map(m => m.name.toUpperCase())
                        ])).map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="___CUSTOM___">+ ADD NEW MODE...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input 
                          className="form-control" 
                          autoFocus
                          placeholder="Type new payment mode..." 
                          value={form.method} 
                          onChange={set('method')} 
                          onBlur={(e) => {
                            if (!e.target.value) setForm(f => ({ ...f, method: 'CASH', is_custom_method: false }))
                          }}
                        />
                        <button 
                          type="button" 
                          className="btn btn--ghost btn--xs" 
                          onClick={() => setForm(f => ({ ...f, method: 'CASH', is_custom_method: false }))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receipt Toggle & Input */}
                <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.is_manual_receipt ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="var(--primary)" />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Receipt Details</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      <input type="checkbox" checked={form.is_manual_receipt} onChange={set('is_manual_receipt')} style={{ width: 14, height: 14 }} />
                      Manual Entry
                    </label>
                  </div>
                  {form.is_manual_receipt ? (
                    <div className="animate-in">
                      <input 
                        className="form-control" 
                        style={{ border: '2px solid var(--primary)', background: '#fff' }}
                        placeholder="Type manual receipt number..." 
                        value={form.receipt_no} 
                        onChange={set('receipt_no')} 
                        required={form.is_manual_receipt}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} color="var(--success)" />
                      System will auto-generate subsequent receipt number
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: 16 }}>
                  <label className="form-label">Internal Notes (Private)</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any specific details about this payment..." style={{ minHeight: 60 }} />
                </div>

                <div className="form-group-inline" style={{ marginTop: 16, padding: '12px', background: 'var(--primary-bg)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>WhatsApp Notification</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Send Hindi receipt details to borrower</div>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={form.send_whatsapp} onChange={set('send_whatsapp')} />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ background: '#f8fafc', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn--outline" onClick={onClose} style={{ padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving} style={{ padding: '10px 28px', fontSize: 14 }}>
                  {saving ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
