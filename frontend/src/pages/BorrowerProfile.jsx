import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Printer, ArrowLeft, Save, User, MapPin, 
  Shield, FileText, Clock, CreditCard, MoreVertical,
  Smartphone, Car, Zap, Info, CheckCircle, RefreshCw
} from 'lucide-react'
import api from '../api'
import { fmtDate, fmtCurrency } from '../utils'

const CSS = `
  .bp { font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; }
  .bp-hero { background:linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); padding:28px 32px 0; border-bottom:1px solid #e2e8f0; }
  .bp-hero-top { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
  .bp-avatar { width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;flex-shrink:0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
  .bp-name { color:#0f172a;font-size:26px;font-weight:900;line-height:1; text-transform: uppercase; }
  .bp-sub { color:#64748b;font-size:12px;margin-top:6px;font-weight:600;letter-spacing:0.5px; }
  .bp-sub span { color:#6366f1; }
  .bp-hero-actions { margin-left:auto;display:flex;gap:10px;align-items:center; }

  .bp-stats { display:flex;gap:1px;background:#e2e8f0;border-top:1px solid #e2e8f0;margin:0 -32px; }
  .bp-stat { flex:1;padding:16px 20px;background:white;text-align:center;transition:0.2s; }
  .bp-stat-label { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px; }
  .bp-stat-val { font-size:20px;font-weight:900;color:#0f172a; }
  .bp-stat-val.green { color:#059669; }
  .bp-stat-val.red { color:#dc2626; }

  .bp-body { display:grid;grid-template-columns:1fr 340px;gap:20px;padding:20px;max-width:1800px;margin:0 auto; }
  .bp-card { background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .bp-card-hdr { padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;display:flex;align-items:center;gap:8px; }
  .bp-card-body { padding:16px; }

  .lt { width:100%;border-collapse:collapse;font-size:11px; }
  .lt th { background:#f8fafc;padding:10px 8px;text-align:left;font-weight:800;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;font-size:9px;text-transform:uppercase;letter-spacing:0.5px; }
  .lt td { padding:8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#334155; }
  
  .fi { width:100%;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;outline:none;padding:4px 6px;box-sizing:border-box; background: white; font-weight: 600; }
  .fi:focus { border-color:#6366f1; }
  .mono { font-family:'JetBrains Mono',monospace;font-size:10px; }
  
  .bx { padding:4px 10px;border-radius:100px;font-size:9px;font-weight:800;text-transform:uppercase;display:inline-block; }
  .bx-paid { background:#dcfce7;color:#166534; }
  .bx-paying { background:#dbeafe;color:#1e40af; }
  .bx-pending { background:#f1f5f9;color:#475569; }
  
  .delay-tag { font-size:10px;font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 6px;border-radius:4px; }
  .delay-none { color:#059669;background:#ecfdf5;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px; }

  .btn { border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:0.2s; border:1px solid #e2e8f0; background:white; color:#64748b; }
  .btn:hover { background:#f8fafc; color:#0f172a; border-color:#cbd5e1; }
  .btn-primary { background:#6366f1; color:white; border:none; }
  .btn-primary:hover { background:#4f46e5; }
  .btn-settle { background:#059669; color:white; border:none; }
  .btn-settle:hover { background:#047857; }
  
  .info-row { display:flex;align-items:flex-start;gap:10px;margin-bottom:14px; }
  .info-ic { width:28px;height:28px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;flex-shrink:0; }
  .info-label { font-size:9px;color:#94a3b8;font-weight:800;text-transform:uppercase;margin-bottom:2px; }
  .info-val { font-size:13px;font-weight:700;color:#1e293b;line-height:1.3; }

  .summary-row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed #e2e8f0; font-size:11px; }
  .summary-row:last-child { border-bottom:none; }
  .summary-lbl { color:#64748b; font-weight:600; }
  .summary-val { color:#0f172a; font-weight:800; }
`;

export default function BorrowerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Row data states
  const [receiptNo, setReceiptNo] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [chequeNo, setChequeNo] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [rowInputs, setRowInputs] = useState({})

  const fetchData = async () => {
    try { 
      setLoading(true)
      const r = await api.get(`/reports/individual-balance/${id}`)
      setData(r.data)
    } catch (err) { 
      setError('Failed to load borrower profile.') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [id])

  const borrower = data?.borrower
  const loan = borrower?.latest_loan || borrower?.latestLoan
  const installments = useMemo(() => {
    const raw = loan?.installments || []
    return [...raw].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
  }, [loan])

  const handlePayRow = async (ins) => {
    const inputs = rowInputs[ins.id] || {}
    const paidAmt = inputs.paid_amount || ins.amount_due
    
    if (!paidAmt || paidAmt <= 0) return alert('Enter a valid amount.')
    
    setSaving(true)
    const delay = getDelay(ins.due_date, paymentDate)
    const fineRate = inputs.fine_rate || 10
    const totalFine = delay * fineRate

    try {
      await api.patch(`/installments/${ins.id}/pay`, {
        paid_date: paymentDate,
        amount_collected: paidAmt,
        principal_amount: inputs.pri || ins.principal_amount,
        interest_amount: inputs.int || ins.interest_amount,
        penalty: totalFine, 
        method: paymentMethod,
        receipt_no: receiptNo,
        cheque_no: chequeNo,
        notes: notes
      })
      setReceiptNo(''); setChequeNo(''); setNotes(''); setRowInputs({});
      fetchData()
      alert('Payment recorded successfully!')
    } catch (ex) { 
      alert('Error: ' + (ex.response?.data?.message || 'Unknown error')) 
    } finally { 
      setSaving(false) 
    }
  }

  const getDelay = (dueDate, pDate) => {
    const due = new Date(dueDate)
    const today = new Date(pDate)
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const updateRowInput = (insId, field, val) => {
    setRowInputs(prev => ({
      ...prev,
      [insId]: { ...(prev[insId] || {}), [field]: val }
    }))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Profile...</div>
  if (error || !data || !borrower) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error || 'Data missing'}</div>

  const vehicle = borrower.vehicle
  const summary = data.summary

  return (
    <div className="bp">
      <style>{CSS}</style>

      <div className="bp-hero">
        <div className="bp-hero-top">
          <div className="bp-avatar">{borrower.name ? borrower.name.charAt(0) : '?'}</div>
          <div>
            <h1 className="bp-name">{borrower.name}</h1>
            <p className="bp-sub">FNO: <span>{borrower.folio_no}</span> • Type: <span>{borrower.type || 'PENDING'}</span> • SNO: {borrower.id}</p>
          </div>
          <div className="bp-hero-actions">
            <button className="btn btn-primary"><Zap size={14}/> Collect Payment</button>
            <button className="btn btn-settle"><CheckCircle size={14}/> Settlement</button>
            <button className="btn"><RefreshCw size={14}/> Recalculate</button>
            <button className="btn" onClick={() => window.print()}><Printer size={16}/> Print</button>
            <button className="btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/> Back</button>
          </div>
        </div>

        <div className="bp-stats">
          <div className="bp-stat">
            <div className="bp-stat-label">Total Loan</div>
            <div className="bp-stat-val">₹{fmtCurrency(summary?.total_amount)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Total Paid</div>
            <div className="bp-stat-val green">₹{fmtCurrency(summary?.total_paid)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Balance Owed</div>
            <div className="bp-stat-val red">₹{fmtCurrency(summary?.balance)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Installments</div>
            <div className="bp-stat-val green">{installments.length} Records</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Monthly Inst.</div>
            <div className="bp-stat-val">₹{loan ? fmtCurrency(loan.installment_amount) : '0'}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Interest Rate</div>
            <div className="bp-stat-val">18.01% p.a.</div>
          </div>
        </div>
      </div>

      <div className="bp-body">
        <main>
          <div className="bp-card">
            <div className="bp-card-hdr"><CreditCard size={14}/> Legacy Payment Ledger — {borrower.name}</div>
            <div className="bp-card-body" style={{ padding: 0 }}>
              <table className="lt">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th style={{ width: 80 }}>INS AMT</th>
                    <th style={{ width: 80 }}>DUE DATE</th>
                    <th style={{ width: 70 }}>PRI</th>
                    <th style={{ width: 70 }}>INT</th>
                    <th style={{ width: 90 }}>RECEIPT NO</th>
                    <th style={{ width: 80 }}>MODE</th>
                    <th style={{ width: 100 }}>PAID DATE</th>
                    <th style={{ width: 100 }}>PAID AMT</th>
                    <th style={{ width: 80 }}>COVERAGE</th>
                    <th style={{ width: 60 }}>DELAY</th>
                    <th style={{ width: 60 }}>FINE/D</th>
                    <th style={{ width: 60 }}>FINED</th>
                    <th style={{ width: 80 }}>BAL</th>
                    <th style={{ width: 60 }}>STATUS</th>
                    <th style={{ width: 40 }}>ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((ins, idx) => {
                    const isFirstPending = installments.find(i => i.status !== 'PAID')?.id === ins.id
                    const lateDays = getDelay(ins.due_date, paymentDate)
                    const inputs = rowInputs[ins.id] || {}

                    return (
                      <tr key={ins.id} style={isFirstPending ? { background: '#eff6ff' } : {}}>
                        <td className="mono" style={{ color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.amount_due)}</td>
                        {ins.status !== 'PAID' ? (
                          <>
                            <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                            <td><input type="number" className="fi mono" value={inputs.pri !== undefined ? inputs.pri : Number(ins.principal_amount || 0).toFixed(0)} onChange={e => updateRowInput(ins.id, 'pri', e.target.value)} /></td>
                            <td><input type="number" className="fi mono" value={inputs.int !== undefined ? inputs.int : Number(ins.interest_amount || 0).toFixed(0)} onChange={e => updateRowInput(ins.id, 'int', e.target.value)} /></td>
                            <td><input type="text" className="fi" value={isFirstPending ? receiptNo : ''} onChange={e => isFirstPending && setReceiptNo(e.target.value)} placeholder="Ref No" /></td>
                            <td>
                              <select className="fi" value={isFirstPending ? paymentMethod : 'CASH'} onChange={e => isFirstPending && setPaymentMethod(e.target.value)}>
                                <option>CASH</option>
                                <option>ONLINE</option>
                                <option>CHEQUE</option>
                              </select>
                              {isFirstPending && paymentMethod === 'CHEQUE' && <input type="text" className="fi" style={{ marginTop: 4, fontSize: 9 }} value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="No" />}
                            </td>
                            <td><input type="date" className="fi" value={isFirstPending ? paymentDate : ''} onChange={e => isFirstPending && setPaymentDate(e.target.value)} /></td>
                            <td><input type="number" className="fi mono green" style={{ fontSize: 13 }} value={inputs.paid_amount !== undefined ? inputs.paid_amount : Number(ins.amount_due).toFixed(0)} onChange={e => updateRowInput(ins.id, 'paid_amount', e.target.value)} /></td>
                            <td style={{ fontWeight: 600 }}>1 Month</td>
                            <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                            <td><input type="number" className="fi" value={inputs.fine_rate || 10} onChange={e => updateRowInput(ins.id, 'fine_rate', parseInt(e.target.value))} /></td>
                            <td className="mono" style={{ fontWeight: 700, color: '#dc2626' }}>₹{fmtCurrency(lateDays * (inputs.fine_rate || 10))}</td>
                            <td className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>₹{fmtCurrency((Number(ins.balance || 0) + Number(ins.amount_due)) + (lateDays * (inputs.fine_rate || 10)) - (inputs.paid_amount || Number(ins.amount_due)))}</td>
                            <td><span className="bx bx-paying">PAYING</span></td>
                            <td><button className="btn-primary" style={{ padding: '4px 6px', borderRadius: 4 }} disabled={saving || !isFirstPending} onClick={() => handlePayRow(ins)}><Save size={12}/></button></td>
                          </>
                        ) : (
                          <>
                            <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                            <td className="mono">₹{fmtCurrency(ins.principal_amount)}</td>
                            <td className="mono">₹{fmtCurrency(ins.interest_amount)}</td>
                            <td className="mono" style={{ fontWeight: 700, color: '#6366f1' }}>{ins.receipt_no}</td>
                            <td><span className="bx bx-paid" style={{ background:'#f0fdf4', color:'#15803d' }}>{ins.method}</span></td>
                            <td className="mono">{fmtDate(ins.paid_date)}</td>
                            <td style={{ fontWeight: 800, color: '#059669' }}>₹{fmtCurrency(ins.amount_paid)}</td>
                            <td style={{ fontWeight: 600 }}>1 Month</td>
                            <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                            <td className="mono">₹{fmtCurrency(ins.fine_rate || 0)}</td>
                            <td className="mono">₹{fmtCurrency(ins.penalty || 0)}</td>
                            <td className="mono" style={{ fontWeight: 700 }}>₹{fmtCurrency(ins.balance)}</td>
                            <td><span className="bx bx-paid">PAID</span></td>
                            <td><MoreVertical size={12} style={{ opacity: 0.3 }}/></td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="bp-card">
            <div className="bp-card-hdr"><User size={14}/> Identity & Contact</div>
            <div className="bp-card-body">
              <div className="info-row">
                <div className="info-ic"><User size={14}/></div>
                <div><div className="info-label">Father / Husband</div><div className="info-val">{borrower.father_name || 'N/A'}</div></div>
              </div>
              <div className="info-row">
                <div className="info-ic"><Smartphone size={14}/></div>
                <div><div className="info-label">Mobile</div><div className="info-val">{borrower.phone || borrower.mobile || 'N/A'}</div></div>
              </div>
              <div className="info-row">
                <div className="info-ic"><MapPin size={14}/></div>
                <div><div className="info-label">Address</div><div className="info-val">{borrower.address || 'N/A'}</div></div>
              </div>
              <div className="info-row">
                <div className="info-ic"><Info size={14}/></div>
                <div><div className="info-label">CB Code</div><div className="info-val">CASH</div></div>
              </div>
            </div>
          </div>

          {vehicle && (
            <div className="bp-card">
              <div className="bp-card-hdr"><Car size={14}/> Asset Details</div>
              <div className="bp-card-body">
                <div style={{ background:'#eff6ff', padding:12, borderRadius:10, border:'1px solid #dbeafe', marginBottom:12 }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'#2563eb', letterSpacing:1 }}>{vehicle.vehicle_no}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginTop:4 }}>{vehicle.model_name || 'NEW'} • {vehicle.color || 'BLACK AND'}</div>
                </div>
                <div className="summary-row"><span className="summary-lbl">Chassis</span><span className="summary-val">{vehicle.chassis_no || 'N/A'}</span></div>
                <div className="summary-row"><span className="summary-lbl">Engine</span><span className="summary-val">{vehicle.engine_no || 'N/A'}</span></div>
                <div className="summary-row"><span className="summary-lbl">Make Year</span><span className="summary-val">{vehicle.make_year || 'N/A'}</span></div>
              </div>
            </div>
          )}

          <div className="bp-card">
            <div className="bp-card-hdr"><FileText size={14}/> Loan Summary</div>
            <div className="bp-card-body">
              <div className="summary-row"><span className="summary-lbl">Finance Amt</span><span className="summary-val">₹{loan ? fmtCurrency(loan.loan_amount) : '0'}</span></div>
              <div className="summary-row"><span className="summary-lbl">Agreement Amt</span><span className="summary-val">₹{loan ? fmtCurrency(loan.total_amount) : '0'}</span></div>
              <div className="summary-row"><span className="summary-lbl">HP Amount</span><span className="summary-val">₹0</span></div>
              <div className="summary-row"><span className="summary-lbl">Interest Amt</span><span className="summary-val">₹{loan ? fmtCurrency(loan.interest_amount) : '0'}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
