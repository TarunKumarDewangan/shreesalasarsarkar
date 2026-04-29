import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  Printer, ArrowLeft, User, Car, MapPin, Wallet, 
  Calendar, CreditCard, Clock, FileText, ChevronRight,
  Plus, CheckCircle, Edit2, Trash2, Check, X, RefreshCw
} from 'lucide-react'
import api from '../api'
import { fmtDate, fmtCurrency } from '../utils'

const CSS = `
  .bp { font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; }
  .bp-hero { background:linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); padding:28px 32px 0; border-bottom:1px solid #e2e8f0; }
  .bp-hero-top { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
  .bp-avatar { width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;flex-shrink:0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
  .bp-name { color:#0f172a;font-size:26px;font-weight:900;line-height:1; }
  .bp-sub { color:#64748b;font-size:12px;margin-top:6px;font-weight:600;letter-spacing:0.5px; }
  .bp-sub span { color:#6366f1; }
  .bp-hero-actions { margin-left:auto;display:flex;gap:10px;align-items:center; }

  .bp-stats { display:flex;gap:1px;background:#e2e8f0;border-top:1px solid #e2e8f0;margin:0 -32px; }
  .bp-stat { flex:1;padding:16px 20px;background:white;text-align:center;transition:0.2s; }
  .bp-stat-label { font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:4px; }
  .bp-stat-val { font-size:20px;font-weight:900;color:#0f172a; }
  .bp-stat-val.green { color:#059669; }
  .bp-stat-val.red { color:#dc2626; }

  .bp-body { display:grid;grid-template-columns:1fr 300px;gap:20px;padding:20px;max-width:1800px;margin:0 auto; }
  .bp-card { background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .bp-card-hdr { padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;display:flex;align-items:center;gap:8px; }
  .bp-card-body { padding:16px; }

  .lt { width:100%;border-collapse:collapse;font-size:11px; }
  .lt th { background:#f8fafc;padding:8px 12px;text-align:left;font-weight:800;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;font-size:10px;letter-spacing:0.5px; }
  .lt td { padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#334155; }
  
  .info-row { display:flex;align-items:flex-start;gap:10px;margin-bottom:14px; }
  .info-ic { width:28px;height:28px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#64748b;flex-shrink:0; }
  .info-label { font-size:9px;color:#94a3b8;font-weight:800;text-transform:uppercase;margin-bottom:2px; }
  .info-val { font-size:13px;font-weight:700;color:#1e293b;line-height:1.3; }

  .btn { border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:0.2s; border:1px solid #e2e8f0; }
  .btn-back { background:white; color:#64748b; }
  .btn-back:hover { background:#f8fafc;color:#0f172a; border-color:#cbd5e1; }
  .btn-primary { background:#6366f1; color:white; border:none; }
  .btn-primary:hover { background:#4f46e5; }
  
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:100; }
  .modal { background:white; width:400px; border-radius:16px; overflow:hidden; }
  .modal-hdr { padding:16px; border-bottom:1px solid #e2e8f0; font-weight:800; display:flex; justify-content:space-between; align-items:center; }
  .modal-body { padding:16px; }
  .input { width:100%; padding:8px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:12px; box-sizing:border-box; }
  .fi { border:1px solid #e2e8f0; border-radius:4px; font-size:11px; outline:none; }
  .fi:focus { border-color:#6366f1; }

  .lt th { background:#f8fafc; color:#64748b; font-size:9px; text-transform:uppercase; letter-spacing:0.5px; padding:10px 8px; border-bottom:2px solid #e2e8f0; }
  .lt td { padding:8px; border-bottom:1px solid #f1f5f9; font-size:11px; vertical-align:middle; }
  
  .bx { padding:4px 10px; border-radius:100px; font-size:9px; font-weight:800; text-transform:uppercase; display:inline-block; }
  .bx-paid { background:#dcfce7; color:#166534; }
  .bx-paying { background:#dbeafe; color:#1e40af; }
  .bx-pending { background:#f1f5f9; color:#475569; }
  .bx-online { background:#e0f2fe; color:#0369a1; }
  .bx-cheque { background:#fef3c7; color:#92400e; }
  .bx-cash { background:#f0fdf4; color:#15803d; border: 1px solid #dcfce7; }
  
  .delay-tag { font-size:10px; font-weight:700; color:#dc2626; background:#fef2f2; padding:2px 6px; border-radius:4px; }
  .delay-none { color:#059669; background:#ecfdf5; font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; }
`

export default function BacklogProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [showSettle, setShowSettle] = useState(false)
  
  const [payForm, setPayForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], mode: 'CASH', rno: '' })
  const [settleForm, setSettleForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], mode: 'CASH' })
  const [inlineRow, setInlineRow] = useState(null)
  const [autoSplit, setAutoSplit] = useState(true) // Default to ON as requested
  const [editRow, setEditRow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [shouldFocus, setShouldFocus] = useState(false)
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (inlineRow && shouldFocus && firstInputRef.current) {
      firstInputRef.current.focus()
      setShouldFocus(false)
    }
  }, [inlineRow, shouldFocus])

  const fetchData = () => {
    setLoading(true)
    api.get(`/backlog/${id}`)
      .then(r => {
        setData(r.data)
        setSettleForm(prev => ({...prev, amount: r.data.summary.balance}))
      })
      .finally(() => setLoading(false))
  }

  const autoCalculateSplit = (amount, balance) => {
    if (!data) return { principal: 0, interest: 0 }
    const { account } = data
    
    const totalInt = parseFloat(account.interest_amount) || 0
    const totalMonths = parseFloat(account.total_months) || 1
    const monthlyInt = totalInt / totalMonths
    
    // Fixed display values as requested
    const interest = Math.ceil(monthlyInt); // Roundup
    const instAmt = parseFloat(account.installment_amount) || 2581;
    const principal = instAmt - interest;
    
    return {
      principal: principal,
      interest: interest
    }
  }

  useEffect(fetchData, [id])

  const submitPayment = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/backlog/${id}/payment`, payForm)
      setShowPay(false)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleAddNewRow = () => {
    if (!data) return
    const { account, summary } = data
    const lastRow = account.installments[account.installments.length - 1]
    let nextDueDate = new Date()
    
    if (lastRow) {
      nextDueDate = new Date(lastRow.due_date)
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }

    const defaultInst = account.installment_amount || (account.total_amount / (account.total_months || 1))
    const initialPaid = Math.min(defaultInst, summary.balance)
    const split = autoCalculateSplit(initialPaid, summary.balance)

    setInlineRow({
      due_date: nextDueDate.toISOString().split('T')[0],
      payment_date: new Date().toISOString().split('T')[0],
      rno: '',
      paid_amount: initialPaid,
      principal_amount: split.principal,
      interest_amount: split.interest,
      fine_amount: 0,
      exc_amount: 0,
      mode: 'CASH',
      cheque_no: '',
      coverage: '1 Month',
      rate_per_day: 10
    })
    setShouldFocus(true)
  }

  const handleSaveInline = async () => {
    setSaving(true)
    try {
      const emi = parseFloat(account.installment_amount) || 2581;
      const totalPaid = parseFloat(inlineRow.paid_amount) || 0;
      const delay = getDelay(inlineRow.due_date, inlineRow.payment_date);
      const totalFine = delay * (parseFloat(inlineRow.rate_per_day) || 0);

      const payload = {
        amount: inlineRow.paid_amount,
        payment_date: inlineRow.payment_date,
        due_date: inlineRow.due_date,
        mode: inlineRow.mode,
        rno: inlineRow.rno,
        principal_amount: inlineRow.principal_amount,
        interest_amount: inlineRow.interest_amount,
        fine_amount: totalFine,
        exc_amount: inlineRow.exc_amount,
        coverage: inlineRow.coverage,
        rate_per_day: inlineRow.rate_per_day,
        cheque_no: inlineRow.cheque_no
      };

      if (autoSplit && totalPaid > emi) {
        // Create first row for EMI
        await api.post(`/backlog/${id}/payment`, { ...payload, amount: emi });
        
        // Calculate next month due date
        const d = new Date(inlineRow.due_date);
        d.setMonth(d.getMonth() + 1);
        const nextDate = d.toISOString().split('T')[0];
        
        // Create second row for remaining
        await api.post(`/backlog/${id}/payment`, { 
          ...payload, 
          amount: totalPaid - emi, 
          due_date: nextDate,
          rno: inlineRow.rno ? `${inlineRow.rno}-B` : '',
          installment_no: (parseInt(inlineRow.installment_no) || 0) + 1
        });
      } else {
        await api.post(`/backlog/${id}/payment`, payload);
      }
      
      setInlineRow(null)
      fetchData()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || 'Failed to save payment'))
    } finally {
      setSaving(false)
    }
  }

  const handleEditRow = (ins) => {
    setEditRow({
      id: ins.id,
      due_date: ins.due_date,
      payment_date: ins.payment_date,
      rno: ins.rno,
      paid_amount: ins.paid_amount,
      principal_amount: ins.principal_amount,
      interest_amount: ins.interest_amount,
      fine_amount: ins.fine_amount,
      exc_amount: ins.exc_amount,
      mode: ins.mode,
      coverage: ins.coverage,
      status: ins.status,
      rate_per_day: ins.rate_per_day || 10,
      cheque_no: ins.cheque_no || ''
    })
  }

  const handleUpdateRow = async () => {
    setSaving(true)
    try {
      await api.patch(`/backlog-installments/${editRow.id}`, {
        amount: editRow.paid_amount,
        payment_date: editRow.payment_date,
        due_date: editRow.due_date,
        mode: editRow.mode,
        rno: editRow.rno,
        principal_amount: editRow.principal_amount,
        interest_amount: editRow.interest_amount,
        fine_amount: editRow.fine_amount,
        exc_amount: editRow.exc_amount,
        coverage: editRow.coverage,
        status: editRow.status,
        rate_per_day: editRow.rate_per_day,
        cheque_no: editRow.cheque_no
      })
      setEditRow(null)
      fetchData()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || 'Failed to update installment'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRow = async (insId) => {
    if (!confirm('Are you sure you want to delete this installment? Balances will be recalculated.')) return
    setSaving(true)
    try {
      await api.delete(`/backlog-installments/${insId}`)
      fetchData()
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || 'Failed to delete installment'))
    } finally {
      setSaving(false)
    }
  }

  const submitSettle = async (e) => {
    e.preventDefault()
    await api.post(`/backlog/${id}/settle`, settleForm)
    setShowSettle(false)
    fetchData()
  }

  const handleRecalculate = async () => {
    if (!confirm('This will recalculate Principal and Interest for ALL installments based on the flat rate system. Continue?')) return
    setSaving(true)
    try {
      await api.post(`/backlog/${id}/recalculate`)
      await fetchData()
      alert('Success: All installments have been recalculated!')
    } catch (e) {
      alert('Error: ' + (e.response?.data?.message || 'Failed to recalculate'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ background:'white', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', fontFamily:'Inter,sans-serif' }}>Loading...</div>
  if (!data) return <div>Not found</div>

  const { account, summary } = data
  const initials = account.customer_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const getDelay = (due, paid) => {
    if (!due || !paid) return 0
    const d1 = new Date(due)
    const d2 = new Date(paid)
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  return (
    <div className="bp">
      <style>{CSS}</style>

      <div className="bp-hero">
        <div className="bp-hero-top">
          <div className="bp-avatar">{initials}</div>
          <div>
            <div className="bp-name">{account.customer_name}</div>
            <div className="bp-sub">
              FNO: <span>{account.fno}</span>
              &nbsp;•&nbsp; Type: <span>{account.type === 'P' ? 'PENDING' : 'FINAL'}</span>
              &nbsp;•&nbsp; SNO: <span>{account.sno}</span>
            </div>
          </div>
          <div className="bp-hero-actions">
            <button className="btn btn-primary" onClick={handleAddNewRow}><Plus size={16}/> Collect Payment</button>
            <button className="btn btn-primary" style={{ background: '#059669' }} onClick={() => setShowSettle(true)}><CheckCircle size={16}/> Settlement</button>
            <button className="btn btn-back" onClick={handleRecalculate} disabled={saving}><RefreshCw size={14}/> {saving ? '...' : 'Recalculate'}</button>
            <button className="btn btn-back" onClick={() => window.print()}><Printer size={16}/> Print</button>
            <button className="btn btn-back" onClick={() => navigate(-1)}><ArrowLeft size={14}/> Back</button>
          </div>
        </div>

        <div className="bp-stats">
          {[
            { label: 'Total Loan', val: `₹${fmtCurrency(account.total_amount)}`, cls: '' },
            { label: 'Total Paid', val: `₹${fmtCurrency(summary.total_paid)}`, cls: 'green' },
            { label: 'Balance Owed', val: `₹${fmtCurrency(summary.balance)}`, cls: summary.balance > 0 ? 'red' : '' },
            { label: 'Installments', val: `${summary.installment_count} Records`, cls: 'green' },
            { label: 'Monthly Inst.', val: `₹${fmtCurrency(account.installment_amount)}`, cls: 'emerald' },
            { 
              label: 'Interest Rate', 
              val: (() => {
                const principal = (parseFloat(account.finance_amount) || 0) + (parseFloat(account.hp_amount) || 0) + (parseFloat(account.agreement_amount) || 0);
                const interest = parseFloat(account.interest_amount) || 0;
                const years = (parseFloat(account.total_months) || 1) / 12;
                if (principal <= 0 || years <= 0) return '0% p.a.';
                const rate = (interest / principal) / years * 100;
                return `${rate.toFixed(2)}% p.a.`;
              })(), 
              cls: 'blue' 
            },
          ].map((s, i) => (
            <div key={i} className="bp-stat">
              <div className="bp-stat-label">{s.label}</div>
              <div className={`bp-stat-val ${s.cls}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bp-body">
        <main>
          <div className="bp-card">
            <div className="bp-card-hdr"><Wallet size={12}/> Legacy Payment Ledger — {account.customer_name}</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="lt">
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ width: 80 }}>INS AMT</th>
                    <th style={{ width: 90 }}>DUE DATE</th>
                    <th style={{ width: 70 }}>PRI</th>
                    <th style={{ width: 70 }}>INT</th>
                    <th style={{ width: 100 }}>RECEIPT NO</th>
                    <th style={{ width: 80 }}>MODE</th>
                    <th style={{ width: 100 }}>PAID DATE</th>
                    <th style={{ width: 110 }}>PAID AMT</th>
                    <th style={{ width: 80 }}>COVERAGE</th>
                    <th style={{ width: 60 }}>DELAY</th>
                    <th style={{ width: 60 }}>FINE/d</th>
                    <th style={{ width: 60 }}>FINED</th>
                    <th style={{ width: 80 }}>BAL</th>
                    <th style={{ width: 60 }}>STATUS</th>
                    <th style={{ width: 60 }}>ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {account.installments.length === 0 && !inlineRow ? (
                    <tr><td colSpan={16} style={{ textAlign:'center', padding:40, color:'#64748b' }}>No installment records found for this account.</td></tr>
                  ) : (
                    <>
                      {inlineRow && (
                        <tr className="row-paying">
                          <td className="mono" style={{ color: '#0369a1', fontWeight: 800 }}>{account.installments.length + 1}</td>
                          <td><span className="amt-main">₹{fmtCurrency(account.installment_amount || (account.total_amount / (account.total_months || 1)))}</span></td>
                          <td><input ref={firstInputRef} type="date" className="fi" style={{ width: '100%' }} value={inlineRow.due_date} onChange={e => setInlineRow({ ...inlineRow, due_date: e.target.value })} /></td>
                          <td><input type="number" className="fi" style={{ width: '100%' }} value={inlineRow.principal_amount} onChange={e => setInlineRow({ ...inlineRow, principal_amount: e.target.value })} placeholder="PRI" /></td>
                          <td><input type="number" className="fi" style={{ width: '100%' }} value={inlineRow.interest_amount} onChange={e => setInlineRow({ ...inlineRow, interest_amount: e.target.value })} placeholder="INT" /></td>
                          <td><input type="text" className="fi" style={{ width: '100%' }} value={inlineRow.rno} onChange={e => setInlineRow({ ...inlineRow, rno: e.target.value })} placeholder="Ref No" /></td>
                          <td>
                            <select className="fi" style={{ width: '100%' }} value={inlineRow.mode} onChange={e => setInlineRow({ ...inlineRow, mode: e.target.value })}>
                              <option value="CASH">CASH</option>
                              <option value="ONLINE">ONLINE</option>
                              <option value="CHEQUE">CHEQUE</option>
                            </select>
                            {inlineRow.mode === 'CHEQUE' && (
                              <input type="text" className="fi" style={{ width: '100%', marginTop: 4, fontSize: 10, padding: 2 }} value={inlineRow.cheque_no} onChange={e => setInlineRow({ ...inlineRow, cheque_no: e.target.value })} placeholder="Cheque No" />
                            )}
                          </td>
                          <td><input type="date" className="fi" style={{ width: '100%' }} value={inlineRow.payment_date} onChange={e => setInlineRow({ ...inlineRow, payment_date: e.target.value })} /></td>
                          <td><input type="number" className="fi" style={{ width: '100%', fontWeight: 800, color: '#059669' }} value={inlineRow.paid_amount} 
                            onChange={e => {
                              const val = e.target.value;
                              const split = autoCalculateSplit(val, summary.balance);
                              setInlineRow({ ...inlineRow, paid_amount: val, principal_amount: split.principal, interest_amount: split.interest });
                            }} 
                          /></td>
                          <td><input type="text" className="fi" style={{ width: '100%' }} value={inlineRow.coverage} onChange={e => setInlineRow({ ...inlineRow, coverage: e.target.value })} /></td>
                          <td>
                            <div className={getDelay(inlineRow.due_date, inlineRow.payment_date) > 0 ? "delay-tag" : "delay-none"}>
                              {getDelay(inlineRow.due_date, inlineRow.payment_date)} days
                            </div>
                          </td>
                          <td><input type="number" className="fi" style={{ width: '100%', color: '#dc2626', fontWeight: 700 }} value={inlineRow.rate_per_day} onChange={e => setInlineRow({ ...inlineRow, rate_per_day: e.target.value })} /></td>
                          <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(getDelay(inlineRow.due_date, inlineRow.payment_date) * (parseFloat(inlineRow.rate_per_day) || 0))}</td>
                          <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(Math.max(0, summary.balance + (getDelay(inlineRow.due_date, inlineRow.payment_date) * (parseFloat(inlineRow.rate_per_day) || 0)) - (parseFloat(inlineRow.paid_amount) || 0)))}</td>
                          <td><span className="bx bx-paying">PAYING</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button className="btn-primary" style={{ padding: '4px', borderRadius: 4 }} onClick={handleSaveInline} disabled={saving}>{saving ? '...' : <Check size={12}/>}</button>
                              <button className="btn-back" style={{ padding: '4px', borderRadius: 4 }} onClick={() => setInlineRow(null)}><X size={12}/></button>
                              
                              {/* Toggle Switch */}
                              <div 
                                onClick={() => setAutoSplit(!autoSplit)}
                                title={autoSplit ? "Auto-split extra to next month" : "Keep as single row"}
                                style={{ 
                                  width: 28, height: 14, borderRadius: 10, 
                                  background: autoSplit ? '#2563eb' : '#cbd5e1',
                                  position: 'relative', cursor: 'pointer', transition: '0.2s'
                                }}
                              >
                                <div style={{ 
                                  width: 10, height: 10, borderRadius: '50%', 
                                  background: 'white', position: 'absolute', top: 2, 
                                  left: autoSplit ? 16 : 2, transition: '0.2s'
                                }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {account.installments.map((ins, idx) => (
                        <tr key={ins.id} className={editRow?.id === ins.id ? 'row-paying' : 'row-paid'}>
                          <td className="mono" style={{ color: '#94a3b8' }}>{ins.installment_no || idx + 1}</td>
                          
                          {editRow?.id === ins.id ? (
                            <>
                              <td><span className="amt-main">₹{fmtCurrency(ins.installment_amount)}</span></td>
                              <td><input type="date" className="fi" style={{ width: '100%' }} value={editRow.due_date} onChange={e => setEditRow({ ...editRow, due_date: e.target.value })} /></td>
                              <td><input type="number" className="fi" style={{ width: '100%' }} value={editRow.principal_amount} onChange={e => setEditRow({ ...editRow, principal_amount: e.target.value })} /></td>
                              <td><input type="number" className="fi" style={{ width: '100%' }} value={editRow.interest_amount} onChange={e => setEditRow({ ...editRow, interest_amount: e.target.value })} /></td>
                              <td><input type="text" className="fi" style={{ width: '100%' }} value={editRow.rno} onChange={e => setEditRow({ ...editRow, rno: e.target.value })} /></td>
                              <td>
                                <select className="fi" style={{ width: '100%' }} value={editRow.mode} onChange={e => setEditRow({ ...editRow, mode: e.target.value })}>
                                  <option value="CASH">CASH</option>
                                  <option value="ONLINE">ONLINE</option>
                                  <option value="CHEQUE">CHEQUE</option>
                                </select>
                                {editRow.mode === 'CHEQUE' && (
                                  <input type="text" className="fi" style={{ width: '100%', marginTop: 4, fontSize: 10, padding: 2 }} value={editRow.cheque_no} onChange={e => setEditRow({ ...editRow, cheque_no: e.target.value })} placeholder="Cheque No" />
                                )}
                              </td>
                              <td><input type="date" className="fi" style={{ width: '100%' }} value={editRow.payment_date} onChange={e => setEditRow({ ...editRow, payment_date: e.target.value })} /></td>
                              <td><input type="number" className="fi" style={{ width: '100%', fontWeight: 800, color: '#059669' }} value={editRow.paid_amount} 
                                onChange={e => {
                                  const val = e.target.value;
                                  const balanceBefore = (ins.balance_amount || 0) + (ins.paid_amount || 0);
                                  const split = autoCalculateSplit(val, balanceBefore);
                                  setEditRow({ ...editRow, paid_amount: val, principal_amount: split.principal, interest_amount: split.interest });
                                }} 
                              /></td>
                              <td><input type="text" className="fi" style={{ width: '100%' }} value={editRow.coverage} onChange={e => setEditRow({ ...editRow, coverage: e.target.value })} /></td>
                              <td>
                                <div className={getDelay(editRow.due_date, editRow.payment_date) > 0 ? "delay-tag" : "delay-none"}>
                                  {getDelay(editRow.due_date, editRow.payment_date)} days
                                </div>
                              </td>
                              <td><input type="number" className="fi" style={{ width: '100%', color: '#dc2626', fontWeight: 700 }} value={editRow.fine_amount} onChange={e => setEditRow({ ...editRow, fine_amount: e.target.value })} /></td>
                              <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(ins.balance_amount)}</td>
                              <td><input type="number" className="fi" style={{ width: '100%' }} value={editRow.exc_amount} onChange={e => setEditRow({ ...editRow, exc_amount: e.target.value })} /></td>
                              <td><span className="bx bx-paying">PAYING</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button className="btn-primary" style={{ padding: '4px', borderRadius: 4 }} onClick={handleUpdateRow} disabled={saving}><Check size={12}/></button>
                                  <button className="btn-back" style={{ padding: '4px', borderRadius: 4 }} onClick={() => setEditRow(null)}><X size={12}/></button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td><span className="amt-main">₹{fmtCurrency(ins.installment_amount)}</span></td>
                              <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                              <td className="mono">₹{fmtCurrency(ins.principal_amount || 0)}</td>
                              <td className="mono">₹{fmtCurrency(ins.interest_amount || 0)}</td>
                              <td className="mono" style={{ fontWeight: 700, color: '#6366f1' }}>{ins.rno || '—'}</td>
                               <td>
                                 <span className={`bx bx-${(ins.mode || 'CASH').toLowerCase()}`}>{ins.mode || 'N/A'}</span>
                                 {ins.mode === 'CHEQUE' && ins.cheque_no && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>#{ins.cheque_no}</div>}
                               </td>
                              <td className="mono">{fmtDate(ins.payment_date) || '—'}</td>
                              <td>
                                <span className="amt-main">₹{fmtCurrency(ins.paid_amount)}</span>
                              </td>
                              <td style={{ fontWeight: 600 }}>{ins.coverage || '1 Month'}</td>
                              <td>
                                <div className={getDelay(ins.due_date, ins.payment_date) > 0 ? "delay-tag" : "delay-none"}>
                                  {getDelay(ins.due_date, ins.payment_date)} days
                                </div>
                              </td>
                              <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(ins.rate_per_day || 0)}</td>
                              <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(ins.fine_amount || 0)}</td>
                              <td style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(ins.balance_amount)}</td>
                              <td><span className={`bx bx-${(ins.status || 'PAID').toLowerCase()}`}>{ins.status || 'PAID'}</span></td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <Edit2 size={12} style={{ cursor: 'pointer', color: '#64748b' }} onClick={() => handleEditRow(ins)} />
                                  <Trash2 size={12} style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDeleteRow(ins.id)} />
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <aside className="bp-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="bp-card">
            <div className="bp-card-hdr"><User size={12}/> Identity & Contact</div>
            <div className="bp-card-body">
              {[
                { icon: <User size={13}/>, label:'Father / Husband', val: account.father_name },
                { icon: <CreditCard size={13}/>, label:'Mobile', val: account.mobile },
                { icon: <MapPin size={13}/>, label:'Address', val: account.address },
                { icon: <Clock size={13}/>, label:'CB Code', val: account.cbcode },
              ].map((item, i) => (
                <div key={i} className="info-row">
                  <div className="info-ic">{item.icon}</div>
                  <div>
                    <div className="info-label">{item.label}</div>
                    <div className="info-val" style={{ fontSize: item.label === 'Address' ? 11 : 13 }}>{item.val || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bp-card">
            <div className="bp-card-hdr"><Car size={12}/> Asset Details</div>
            <div className="bp-card-body">
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#2563eb', letterSpacing: 1 }}>{account.vehicle_no || 'NO PLATE'}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, fontWeight: 700 }}>
                  {account.vehicle_model || 'N/A'} &nbsp;•&nbsp; {account.vehicle_color || 'N/A'}
                </div>
              </div>
              {[
                { label: 'Chassis', val: account.chassis_no },
                { label: 'Engine', val: account.engine_no },
                { label: 'Make Year', val: account.vehicle_make },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontWeight: 800 }}>{item.val || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bp-card">
            <div className="bp-card-hdr"><Calendar size={12}/> Loan Summary</div>
            <div className="bp-card-body">
              {[
                { label: 'Finance Amt', val: `₹${fmtCurrency(account.finance_amount)}` },
                { label: 'Agreement Amt', val: `₹${fmtCurrency(account.agreement_amount)}` },
                { label: 'HP Amount', val: `₹${fmtCurrency(account.hp_amount)}` },
                { label: 'Interest Amt', val: `₹${fmtCurrency(account.interest_amount)}` },
                { label: 'Inst. Amount', val: `₹${fmtCurrency(account.installment_amount)}` },
                { label: 'Interval', val: account.interval === 1 ? 'Monthly' : `${account.interval} Months` },
                { label: 'Total Months', val: `${account.total_months} Months` },
                { label: 'Guarantor', val: account.guarantor_name },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 11, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontWeight: 800 }}>{item.val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showPay && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={submitPayment}>
            <div className="modal-hdr">Collect Next Installment <button type="button" onClick={() => setShowPay(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount to Collect</label>
                <input type="number" className="input" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input type="date" className="input" value={payForm.payment_date} onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Receipt / Ref No.</label>
                <input type="text" className="input" value={payForm.rno} onChange={e => setPayForm({ ...payForm, rno: e.target.value })} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Payment Mode</label>
                <select className="input" value={payForm.mode} onChange={e => setPayForm({ ...payForm, mode: e.target.value })}>
                  <option value="CASH">CASH</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {showSettle && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={submitSettle}>
            <div className="modal-hdr">Final Settlement <button type="button" onClick={() => setShowSettle(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button></div>
            <div className="modal-body">
              <div style={{ background: '#fff7ed', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 11, color: '#9a3412', fontWeight: 600 }}>
                Remaining Balance: ₹{fmtCurrency(summary.balance)}
              </div>
              <label className="info-label">Settlement Amount</label>
              <input className="input" type="number" required value={settleForm.amount} onChange={e => setSettleForm({...settleForm, amount: e.target.value})} />
              <label className="info-label">Payment Date</label>
              <input className="input" type="date" required value={settleForm.date} onChange={e => setSettleForm({...settleForm, date: e.target.value})} />
              <label className="info-label">Mode</label>
              <select className="input" value={settleForm.mode} onChange={e => setSettleForm({...settleForm, mode: e.target.value})}>
                <option value="CASH">CASH</option>
                <option value="BANK">BANK</option>
                <option value="PHONEPE">PHONEPE</option>
              </select>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#059669' }}>Settle & Close File</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
