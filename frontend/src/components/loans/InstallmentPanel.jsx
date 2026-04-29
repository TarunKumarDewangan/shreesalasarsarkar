import { useEffect, useState } from 'react'
import { X, CheckCircle, RotateCcw } from 'lucide-react'
import api from '../../api'
import PayModal from '../PayModal'
import { fmtDate, fmtCurrency } from '../../utils'

const fmt = fmtCurrency

export default function InstallmentPanel({ loan, onClose }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // installment to pay

  const load = () => {
    setLoading(true)
    api.get(`/loans/${loan.id}/installments`).then(r => setItems(r.data)).finally(() => setLoading(false))
  }
  useEffect(load, [loan.id])

  const markPaid = async (ins, data) => {
    await api.patch(`/installments/${ins.id}/pay`, data)
    setModal(null); load()
  }
  const markUnpay = async ins => {
    if (!confirm('Mark this installment as PENDING?')) return
    await api.patch(`/installments/${ins.id}/unpay`)
    load()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth:980}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{loan.borrower?.name}</h3>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
              ₹{fmt(loan.gross_amount)} @ {loan.interest_rate}% — {items.length} installments
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        <div style={{padding:'0 0 4px'}}>
          {loading ? <p className="loading-text">Loading…</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Receipt No</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>EMI</th>
                    <th>Balance</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Paid On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((ins, i) => (
                    <tr key={ins.id} className={`ins-row${ins.status==='PAID' ? ' ins-row--paid' : ''}`}>
                      <td>{i+1}</td>
                      <td>{fmtDate(ins.due_date)}</td>
                      <td className="td-mono" style={{ fontSize: 11 }}>{ins.receipt_no || '—'}</td>
                      <td>₹{fmt(ins.principal_amount)}</td>
                      <td>₹{fmt(ins.interest_amount)}</td>
                      <td style={{ fontWeight: 600 }}>₹{fmt(ins.amount_due)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>₹{fmt(Number(ins.balance) + (ins.status === 'PAID' ? 0 : Number(ins.amount_due)))}</td>
                      <td>{ins.method || '—'}</td>
                      <td>
                        {ins.status === 'PAID'
                          ? <span className="badge badge--success">Paid</span>
                          : ins.status === 'OVERDUE'
                          ? <span className="badge badge--danger">Overdue</span>
                          : <span className="badge badge--warning">Pending</span>
                        }
                      </td>
                      <td>{fmtDate(ins.paid_date)}</td>
                      <td>
                        {ins.status !== 'PAID'
                          ? <button className="btn btn--success btn--sm" onClick={() => setModal(ins)}>
                              <CheckCircle size={12}/> Pay
                            </button>
                          : <button className="btn btn--outline btn--sm" onClick={() => markUnpay(ins)}>
                              <RotateCcw size={12}/> Undo
                            </button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {modal && <PayModal installment={modal} onPay={data => markPaid(modal, data)} onClose={() => setModal(null)} />}
    </div>
  )
}
