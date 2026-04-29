import { useState, useEffect } from 'react'
import { X, Calendar, Calculator, FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { fmtDate, fmtCurrency } from '../utils'
import api from '../api'

const FINE_PRESETS = [0, 5, 10, 15, 20]

export default function PayModal({ installment, allInstallments = [], onPay, onClose, isStaff = false }) {
  const [modes, setModes] = useState([])
  const amountDue = parseFloat(installment.amount_due) || 0

  const [form, setForm] = useState({
    paid_date: new Date().toISOString().slice(0, 10),
    penalty: '',
    discount: '',
    method: 'CASH',
    notes: '',
    receipt_no: '',
    is_manual_receipt: false,
    send_whatsapp: true,
    // New: custom amount collected
    amount_collected: '',
    // Late fee
    fine_per_day: 10,
    fine_manual: false,
  })

  const [delay, setDelay] = useState({ days: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/payment-methods').then(r => {
      const active = r.data.filter(m => m.is_active)
      setModes(active)
    })
  }, [])

  // Recalculate days late when payment date changes
  useEffect(() => {
    if (!installment?.due_date || !form.paid_date) return
    const due  = new Date(installment.due_date);  due.setHours(0,0,0,0)
    const paid = new Date(form.paid_date);         paid.setHours(0,0,0,0)
    const diffDays = Math.ceil((paid - due) / (1000 * 60 * 60 * 24))
    setDelay({ days: diffDays > 0 ? diffDays : 0 })
  }, [form.paid_date, installment?.due_date])

  // Auto-set penalty when days or fine rate changes
  useEffect(() => {
    if (delay.days > 0 && !form.fine_manual) {
      const computed = delay.days * Number(form.fine_per_day)
      setForm(f => ({ ...f, penalty: computed > 0 ? String(computed) : '' }))
    }
  }, [delay.days, form.fine_per_day, form.fine_manual])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  // Derived calculations
  const penalty      = parseFloat(form.penalty)   || 0
  const discount     = parseFloat(form.discount)  || 0
  const netDue       = amountDue + penalty - discount
  const collected    = form.amount_collected !== '' ? parseFloat(form.amount_collected) : netDue
  const excess       = collected - netDue
  const isOverpaying = excess > 0.5
  const isUnderpaying= collected < netDue - 0.5 && collected > 0

  // How many future installments does excess cover?
  const pendingAfter = allInstallments
    .filter(i => i.id !== installment.id && i.status !== 'PAID')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  let excessLeft = excess
  const autoCovered = []
  for (const ins of pendingAfter) {
    if (excessLeft < 0.5) break
    const due = parseFloat(ins.amount_due)
    autoCovered.push({ ins, amount: Math.min(excessLeft, due), full: excessLeft >= due })
    excessLeft -= due
  }

  const submit = async e => {
    e.preventDefault(); setSaving(true)
    const payload = {
      paid_date: form.paid_date,
      penalty:   penalty > 0 ? penalty : undefined,
      discount:  discount > 0 ? discount : undefined,
      method:    form.method,
      notes:     form.notes || undefined,
      send_whatsapp: form.send_whatsapp,
      amount_collected: collected,
    }
    if (form.is_manual_receipt && form.receipt_no) payload.receipt_no = form.receipt_no
    try { await onPay(payload) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 1020, width: '97vw', padding: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: isStaff ? '1fr' : 'minmax(380px, 1.1fr) 1fr', minHeight: 520 }}>

          {/* LEFT: Ledger */}
          {!isStaff && (
            <div style={{ background: '#f8fafc', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', background: '#fff' }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Loan Installment Ledger</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Quick reference of overall payment history</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                <table className="table--high-density" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 3px' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                      <th style={{ fontSize: 10, padding: 7 }}>#</th>
                      <th style={{ fontSize: 10, padding: 7 }}>DUE DATE</th>
                      <th style={{ fontSize: 10, padding: 7 }}>EMI</th>
                      <th style={{ fontSize: 10, padding: 7 }}>STATUS</th>
                      <th style={{ fontSize: 10, padding: 7 }}>PAID ON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allInstallments.map((ins, idx) => {
                      const isThis = ins.id === installment.id
                      const isCovered = autoCovered.find(c => c.ins.id === ins.id)
                      return (
                        <tr key={ins.id} style={{
                          background: isThis ? 'var(--primary-bg)' : isCovered ? '#f0fdf4' : '#fff',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)', borderRadius: 6
                        }}>
                          <td style={{ padding: '7px', borderTopLeftRadius: 6, borderBottomLeftRadius: 6, fontSize: 11, fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '7px', fontSize: 11 }}>{fmtDate(ins.due_date)}</td>
                          <td style={{ padding: '7px', fontSize: 11, fontWeight: 700 }}>₹{fmtCurrency(ins.amount_due)}</td>
                          <td style={{ padding: '7px' }}>
                            {isCovered
                              ? <span className="badge badge--success" style={{ fontSize: 9 }}>AUTO ✓</span>
                              : <span className={`badge badge--${ins.status === 'PAID' ? 'success' : 'warning'}`} style={{ fontSize: 9 }}>{ins.status}</span>
                            }
                          </td>
                          <td style={{ padding: '7px', borderTopRightRadius: 6, borderBottomRightRadius: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                            {ins.paid_date ? fmtDate(ins.paid_date) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RIGHT: Payment Form */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '18px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Mark Paid</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Entry for installment #{allInstallments.findIndex(i => i.id === installment.id) + 1}</p>
                </div>
              </div>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div className="modal-body" style={{ padding: '18px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Due Info Card */}
                <div style={{ padding: 14, background: 'linear-gradient(135deg,#fff,#f8faff)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Date</label>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtDate(installment.due_date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount Due</label>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>₹{fmtCurrency(amountDue)}</div>
                    </div>
                  </div>

                  {delay.days > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                      <Clock size={13} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Delayed by {delay.days} day{delay.days > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* ── FINE & PENALTY SECTION — Always visible ── */}
                <div style={{ padding: 14, background: delay.days > 0 ? '#fff8f0' : '#f8fafc', borderRadius: 12, border: `1px solid ${delay.days > 0 ? '#fde68a' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <AlertTriangle size={14} color={delay.days > 0 ? '#f59e0b' : 'var(--text-muted)'} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: delay.days > 0 ? '#92400e' : 'var(--text-muted)' }}>
                      {delay.days > 0 ? `Late Fine — ${delay.days} day${delay.days > 1 ? 's' : ''} delay` : 'Fine / Penalty'}
                    </span>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Fine per day (₹) — {delay.days > 0 ? `${delay.days} days` : 'no delay'}</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {FINE_PRESETS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, fine_per_day: p, fine_manual: false }))}
                          style={{
                            padding: '5px 12px', border: '1.5px solid',
                            borderColor: !form.fine_manual && Number(form.fine_per_day) === p ? 'var(--primary)' : 'var(--border)',
                            background: !form.fine_manual && Number(form.fine_per_day) === p ? 'var(--primary-bg)' : '#fff',
                            color: !form.fine_manual && Number(form.fine_per_day) === p ? 'var(--primary)' : 'var(--text)',
                            borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          ₹{p}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, fine_manual: true }))}
                        style={{
                          padding: '5px 12px', border: '1.5px solid',
                          borderColor: form.fine_manual ? 'var(--primary)' : 'var(--border)',
                          background: form.fine_manual ? 'var(--primary-bg)' : '#fff',
                          color: form.fine_manual ? 'var(--primary)' : 'var(--text)',
                          borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                    <div className="grid-2" style={{ gap: 10 }}>
                      {form.fine_manual ? (
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Custom Fine (₹ Total)</label>
                          <input
                            className="form-control"
                            type="number" min="0" step="1"
                            value={form.penalty}
                            onChange={e => setForm(f => ({ ...f, penalty: e.target.value }))}
                            placeholder="Enter total fine"
                            style={{ fontWeight: 700, color: 'var(--danger)' }}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '8px 12px', background: '#fce7f3', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 10, color: '#9d174d', fontWeight: 700 }}>CALCULATED FINE</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: '#be185d' }}>₹{fmtCurrency(penalty)}</span>
                          <span style={{ fontSize: 10, color: '#9d174d' }}>{delay.days} days × ₹{form.fine_per_day}/day</span>
                        </div>
                      )}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 11 }}>Discount (₹)</label>
                        <input className="form-control" type="number" min="0" step="0.01" value={form.discount} onChange={set('discount')} placeholder="0" />
                      </div>
                    </div>
                  </div>


                {/* ── AMOUNT COLLECTED (editable) ── */}
                <div style={{ padding: 14, background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', display: 'block', marginBottom: 8 }}>
                    💰 Amount Collected (₹) — Net Due: ₹{fmtCurrency(netDue)}
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount_collected}
                    onChange={set('amount_collected')}
                    placeholder={`₹${fmtCurrency(netDue)} (full amount)`}
                    style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', border: '2px solid #7dd3fc' }}
                  />

                  {/* Overpay preview */}
                  {isOverpaying && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #6ee7b7' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <TrendingUp size={14} color="#059669" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46' }}>
                          Excess ₹{fmtCurrency(excess)} will auto-cover:
                        </span>
                      </div>
                      {autoCovered.map(({ ins, amount, full }) => (
                        <div key={ins.id} style={{ fontSize: 11, color: '#047857', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>📅 {fmtDate(ins.due_date)}</span>
                          <span style={{ fontWeight: 700 }}>
                            {full ? `✅ Full ₹${fmtCurrency(amount)}` : `⚡ Partial ₹${fmtCurrency(amount)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Underpay preview */}
                  {isUnderpaying && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fdba74' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingDown size={14} color="#ea580c" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#9a3412' }}>
                          Partial payment — Remaining ₹{fmtCurrency(netDue - collected)} will be noted for next collection.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date + Method */}
                <div className="grid-2" style={{ gap: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Payment Date *</label>
                    <input className="form-control" type="date" value={form.paid_date} onChange={set('paid_date')} required disabled={isStaff} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Payment Method *</label>
                    {!form.is_custom_method ? (
                      <select className="form-control" value={form.method} onChange={e => {
                        if (e.target.value === '___CUSTOM___') setForm(f => ({ ...f, method: '', is_custom_method: true }))
                        else setForm(f => ({ ...f, method: e.target.value }))
                      }}>
                        {Array.from(new Set(['CASH','ONLINE','GPAY','PHONEPE','UPI','BANK TRANSFER','CHEQUE', ...modes.map(m => m.name.toUpperCase())])).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="___CUSTOM___">+ ADD NEW MODE...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input className="form-control" autoFocus placeholder="Type new payment mode..." value={form.method} onChange={set('method')}
                          onBlur={e => { if (!e.target.value) setForm(f => ({ ...f, method: 'CASH', is_custom_method: false })) }} />
                        <button type="button" className="btn btn--ghost btn--xs" onClick={() => setForm(f => ({ ...f, method: 'CASH', is_custom_method: false }))}><X size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Receipt */}
                <div style={{ padding: 13, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: form.is_manual_receipt ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <FileText size={14} color="var(--primary)" />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Receipt Details</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      <input type="checkbox" checked={form.is_manual_receipt} onChange={set('is_manual_receipt')} style={{ width: 14, height: 14 }} />
                      Manual Entry
                    </label>
                  </div>
                  {form.is_manual_receipt ? (
                    <input className="form-control" style={{ border: '2px solid var(--primary)', background: '#fff' }} placeholder="Type manual receipt number..." value={form.receipt_no} onChange={set('receipt_no')} required={form.is_manual_receipt} autoFocus />
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} color="var(--success)" /> System will auto-generate subsequent receipt number
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Internal Notes (Private)</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} placeholder="Any specific details about this payment..." style={{ minHeight: 55 }} />
                </div>

                {/* WhatsApp */}
                <div style={{ padding: '10px 14px', background: 'var(--primary-bg)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <CheckCircle2 size={16} />
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

              <div className="modal-footer" style={{ background: '#f8fafc', padding: '14px 22px', borderTop: '1px solid var(--border)' }}>
                {/* Summary line */}
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>
                  Total collecting: <strong style={{ color: 'var(--primary)', fontSize: 14 }}>₹{fmtCurrency(collected)}</strong>
                  {isOverpaying && <span style={{ marginLeft: 8, color: '#059669', fontWeight: 600 }}>+{autoCovered.filter(c => c.full).length} auto-paid</span>}
                </div>
                <button type="button" className="btn btn--outline" onClick={onClose} style={{ padding: '9px 18px' }}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={saving} style={{ padding: '9px 26px', fontSize: 14 }}>
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
