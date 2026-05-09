import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Printer, ArrowLeft, Save, User, MapPin, 
  Shield, FileText, Clock, CreditCard, MoreVertical,
  Smartphone, Car, Zap, Info, CheckCircle, RefreshCw,
  Layers, ArrowDownToLine, ChevronDown, ChevronUp, PlusCircle, X, Trash2
} from 'lucide-react'
import api from '../api'
import { fmtDate, fmtCurrency } from '../utils'

const CSS = `
  .bp { font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; }
  .bp-hero { background:linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%); padding:28px 32px 0; border-bottom:1px solid #e2e8f0; }
  .bp-hero-top { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
  .bp-avatar { width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;flex-shrink:0; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
  .bp-name { color:#0f172a;font-size:26px;font-weight:900;line-height:1; text-transform: uppercase; }
  .bp-sub { color:#64748b;font-size:12px;margin-top:6px;font-weight:600;letter-spacing:0.5px; }
  .bp-sub span { color:#2563eb; }
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

  .lt { width:100%;border-collapse:collapse;font-size:11px; min-width: 1100px; }
  .lt th { background:#f8fafc;padding:10px 8px;text-align:left;font-weight:800;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;font-size:9px;text-transform:uppercase;letter-spacing:0.5px; overflow:hidden; }
  .lt td { padding:8px;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#334155; }
  
  .fi { width:100%;border:1px solid #e2e8f0;border-radius:4px;font-size:11px;outline:none;padding:4px 6px;box-sizing:border-box; background: white; font-weight: 600; }
  .fi:focus { border-color:#3b82f6; }
  .mono { font-family:'JetBrains Mono',monospace;font-size:10px; }
  
  .bx { padding:4px 10px;border-radius:100px;font-size:9px;font-weight:800;text-transform:uppercase;display:inline-block; }
  .bx-paid { background:#dcfce7;color:#166534; }
  .bx-paying { background:#dbeafe;color:#1e40af; }
  .bx-pending { background:#f1f5f9;color:#475569; }
  
  .delay-tag { font-size:10px;font-weight:700;color:#dc2626;background:#fef2f2;padding:2px 6px;border-radius:4px; }
  .delay-none { color:#059669;background:#ecfdf5;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px; }

  .btn { border-radius:10px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;transition:0.2s; border:1px solid #e2e8f0; background:white; color:#64748b; }
  .btn:hover { background:#f8fafc; color:#0f172a; border-color:#cbd5e1; }
  .btn-primary { background:#3b82f6; color:white; border:none; }
  .btn-primary:hover { background:#2563eb; }
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

  .strategy-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px; margin-top:8px; display:flex; gap:12px; align-items:center; }
  .strategy-btn { flex:1; padding:6px; border-radius:6px; border:1px solid #e2e8f0; background:white; font-size:10px; font-weight:800; text-transform:uppercase; cursor:pointer; color:#64748b; text-align:center; }
  .strategy-btn.active { background:#3b82f6; color:white; border-color:#3b82f6; }
  
  .breakup-chip { background:#eff6ff; color:#1e40af; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:800; margin-top:4px; display:inline-block; }
  .toggle-sw { width:32px; height:18px; background:#e2e8f0; border-radius:100px; position:relative; cursor:pointer; transition:0.3s; }
  .toggle-sw.on { background:#3b82f6; }
  .toggle-dot { width:14px; height:14px; background:white; border-radius:50%; position:absolute; top:2px; left:2px; transition:0.3s; }
  .toggle-sw.on .toggle-dot { left:16px; }

  @media print {
    .no-print { display: none !important; }
    .bp { background: white !important; min-height: 0 !important; padding: 0 !important; }
    .bp-hero, .bp-body, .bp- hero-actions { display: none !important; }
    body { background: white !important; margin: 0 !important; padding: 0 !important; }
    
    .print-statement { 
      display: block !important; 
      padding: 0; 
      color: #000; 
      font-family: 'Arial', sans-serif;
      width: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 9999;
      background: white;
    }
    
    /* Hide EVERYTHING else on the page */
    #root > div:not(.print-statement), 
    .sidebar, .navbar, .app-layout-header, .bp-hero, .bp-body, .bp-hero-actions, .no-print { 
      display: none !important; 
    }
    
    .st-header { border-bottom: 2px solid #000; padding: 5px 0; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
    .st-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
    .st-company { font-size: 18px; font-weight: 900; }
    .st-address { font-size: 11px; }
    .st-meta { text-align: right; font-size: 11px; }
    
    .st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #000; margin-bottom: 5px; }
    .st-box { border: 1px solid #000; padding: 4px; }
    .st-box-title { font-size: 12px; font-weight: bold; background: #cccccc !important; -webkit-print-color-adjust: exact; margin: -4px -4px 4px -4px; padding: 2px 4px; border-bottom: 1px solid #000; }
    .st-row { display: flex; font-size: 11px; margin-bottom: 2px; }
    .st-lbl { width: 100px; font-weight: bold; flex-shrink: 0; }
    .st-val { flex-grow: 1; }
    
    .st-table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 2px solid #000; }
    .st-table th, .st-table td { border: 1px solid #000; padding: 2px; text-align: center; font-size: 9px; line-height: 1.1; }
    .st-table th { background: #cccccc !important; font-weight: bold; -webkit-print-color-adjust: exact; text-transform: uppercase; }
    .st-total-row { background: #f0f0f0 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
    
    .st-footer { margin-top: 10px; font-size: 10px; line-height: 1.3; }
    .st-sig-box { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 5px; position: relative; }
    .st-credits { text-align: center; font-size: 8px; font-style: italic; border-top: 1px solid #000; margin-top: 10px; padding-top: 2px; background: #cccccc !important; -webkit-print-color-adjust: exact; }
  }
  
  .preview-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow: auto;
  }
  .preview-cnt {
    background: white;
    width: 210mm; /* A4 width */
    margin: 0 auto;
    padding: 40px;
    min-height: 297mm;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  }
  .preview-hdr {
    width: 210mm;
    margin: 0 auto 10px;
    display: flex;
    justify-content: space-between;
    background: #1e293b;
    padding: 12px 20px;
    border-radius: 8px;
  }
  .fi-val-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #1e293b; }
  .fi-group { display: flex; flex-direction: column; gap: 5px; }

  /* Table row improvements */
  .lt tbody tr:hover td { background: #f0f9ff !important; }
  .lt tbody tr:nth-child(even) td { background: #fafbfc; }
  .lt tbody tr.row-paid td { border-left: 3px solid #10b981; }
  .lt tbody tr.row-paying td { border-left: 3px solid #3b82f6; background: #eff6ff !important; }
  .lt tbody tr.row-placeholder td { border-left: 3px solid #e2e8f0; }
  .lt tbody tr.row-future td { border-left: 3px solid #f59e0b; opacity: 0.55; }
  .lt td { transition: background 0.15s; }

  /* Better badges */
  .badge-paid { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;background:#d1fae5;color:#065f46;letter-spacing:0.3px; }
  .badge-pending { display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;background:#fef3c7;color:#92400e; }
  .badge-mode { display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#ede9fe;color:#5b21b6; }
  .badge-cov { display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#e0f2fe;color:#0369a1; }

  /* CRUD action buttons */
  .act-btn { display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;transition:all 0.15s; }
  .act-btn:hover { transform:scale(1.1); }
  .act-btn.edit:hover { background:#eff6ff;border-color:#3b82f6; }
  .act-btn.del:hover { background:#fef2f2;border-color:#ef4444; }
  .act-btns { display:flex;gap:4px;align-items:center; }
`;

export default function BacklogProfile() {
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
  const [advancedMode, setAdvancedMode] = useState(false)
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false)
  const [selectedIns, setSelectedIns] = useState(null)
  const [editModalIns, setEditModalIns] = useState(null)
  const [editFields, setEditFields] = useState({})
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const handlePrint = () => {
    const printArea = document.getElementById('statement-print-area');
    if (!printArea) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Account Statement - ${borrower.customer_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .st-header { border-bottom: 2px solid #000; padding: 5px 0; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
            .st-title { font-size: 14px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; }
            .st-company { font-size: 18px; font-weight: 900; }
            .st-address { font-size: 11px; }
            .st-meta { text-align: right; font-size: 11px; }
            .st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #000; margin-bottom: 5px; }
            .st-box { border: 1px solid #000; padding: 4px; }
            .st-box-title { font-size: 12px; font-weight: bold; background: #cccccc !important; -webkit-print-color-adjust: exact; margin: -4px -4px 4px -4px; padding: 2px 4px; border-bottom: 1px solid #000; }
            .st-row { display: flex; font-size: 11px; margin-bottom: 2px; }
            .st-lbl { width: 100px; font-weight: bold; flex-shrink: 0; }
            .st-val { flex-grow: 1; }
            .st-table { width: 100%; border-collapse: collapse; margin-top: 5px; border: 2px solid #000; }
            .st-table th, .st-table td { border: 1px solid #000; padding: 2px; text-align: center; font-size: 9px; line-height: 1.1; }
            .st-table th { background: #cccccc !important; font-weight: bold; -webkit-print-color-adjust: exact; text-transform: uppercase; }
            .st-total-row { background: #f0f0f0 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
            .st-footer { margin-top: 10px; font-size: 10px; line-height: 1.3; }
            .st-sig-box { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 5px; position: relative; }
            .st-credits { text-align: center; font-size: 8px; font-style: italic; border-top: 1px solid #000; margin-top: 10px; padding-top: 2px; background: #cccccc !important; -webkit-print-color-adjust: exact; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="no-print" style="text-align: right; margin-bottom: 20px;">
            <button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Close Page</button>
          </div>
          <div class="print-statement">
            ${printArea.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const fetchData = async () => {
    try { 
      setLoading(true)
      const r = await api.get(`/backlog/${id}`)
      setData(r.data)
    } catch (err) { 
      setError('Failed to load backlog profile.') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => { fetchData() }, [id])

  const borrower = data?.account
  const displayRows = useMemo(() => {
    const raw = data?.account?.installments || []
    const sorted = [...raw].sort((a, b) => a.installment_no - b.installment_no)
    const totalMonths = borrower?.total_months || 0
    const rows = []
    let tPaid = 0, tInst = 0, tPri = 0, tInt = 0, tLate = 0;

    const covered = new Map()
    sorted.forEach(ins => {
      covered.set(ins.installment_no, { ...ins, is_placeholder: false })
      const extra = (ins.im || 1) - 1
      for (let i = 1; i <= extra; i++) {
        covered.set(ins.installment_no + i, { is_placeholder: true, parent: ins })
      }
      if (ins.status === 'PAID') {
        tPaid += Number(ins.paid_amount || 0);
        tInst += Number(ins.im || 1);
        tPri += Number(ins.principal_amount || 0);
        tInt += Number(ins.interest_amount || 0);
        const lDays = ins.delay_days !== null ? ins.delay_days : (ins.due_date ? Math.floor((new Date(ins.payment_date || new Date()) - new Date(ins.due_date)) / (1000 * 60 * 60 * 24)) : 0);
        tLate += (lDays > 0 ? lDays : 0);
      }
    })

    const firstIns = sorted[0]
    const baseDate = firstIns?.due_date ? new Date(firstIns.due_date) : (borrower?.created_at ? new Date(borrower.created_at) : new Date())
    
    let realBal = borrower?.total_amount - tPaid;
    let virtualBal = realBal;
    
    rows.forEach(r => {
      r.balance = realBal;
      if (!r.is_placeholder && r.status !== 'PAID') {
        virtualBal -= Number(r.installment_amount || 0);
      }
    })

    let m = 1
    while (m <= totalMonths || covered.has(m) || virtualBal > 1) {
      const existing = covered.get(m)
      const d = new Date(baseDate)
      d.setMonth(d.getMonth() + (m - 1))
      const formattedDue = d.toISOString().split('T')[0]

      if (existing) {
        rows.push({ ...existing, installment_no: m, due_date: existing.due_date || formattedDue, balance: realBal })
      } else {
        rows.push({
          id: `future-${m}`,
          installment_no: m,
          due_date: formattedDue,
          installment_amount: borrower?.installment_amount || 0,
          is_future: true,
          status: 'PENDING',
          balance: realBal
        })
        virtualBal -= Number(borrower?.installment_amount || 0)
      }
      
      m++
      if (m > 500) break; // Safety break
    }
    const tAgr = rows.filter(r => !r.is_placeholder).reduce((sum, r) => sum + Number(r.installment_amount || 0), 0)
    return { rows, totals: { agreement: tAgr, paid: tPaid, inst: tInst, pri: tPri, int: tInt, late: tLate } }
  }, [data, borrower])

  const handlePayRow = async (ins) => {
    const inputs = rowInputs[ins.id] || {}
    const paidAmt = Number(inputs.paid_amount || ins.installment_amount)
    const emi = Number(ins.installment_amount)
    const strategy = inputs.strategy || 'BAL'

    // Auto-calculate PRI/INT based on loan ratio
    const ratio = borrower.finance_amount / borrower.total_amount
    const autoPri = (ins.installment_amount * ratio).toFixed(2)
    const autoInt = (ins.installment_amount - autoPri).toFixed(2)
    
    const finalPri = ins.principal_amount || autoPri
    const finalInt = ins.interest_amount || autoInt

    if (!paidAmt || paidAmt <= 0) return alert('Enter a valid amount.')
    
    setSaving(true)
    const delay = getDelay(ins, paymentDate)
    const fineRate = inputs.fine_rate || 10
    const totalFine = delay * fineRate

    try {
      const isFuture = String(ins.id).startsWith('future-') || ins.id === 'balance-adj'
      
      const paymentData = {
        payment_date: paymentDate,
        amount: paidAmt,
        principal_amount: finalPri,
        interest_amount: finalInt,
        penalty: totalFine, 
        method: paymentMethod,
        rno: receiptNo,
        cheque_no: chequeNo,
        notes: notes,
        im: inputs.im || 1,
        status: 'PAID'
      }

      if (isFuture) {
        // Create NEW installment for Backlog using account-level payment endpoint
        await api.post(`/backlog/${id}/payment`, {
          ...paymentData,
          amount: paidAmt, // backend expects 'amount'
          remarks: notes,  // backend expects 'remarks' for notes
          due_date: ins.due_date,
          rate_per_day: inputs.fine_rate || 10
        })
      } else if (strategy === 'BAL') {
        await api.patch(`/backlog-installments/${ins.id}`, paymentData)
      } else {
        // Multi-Month logic for Backlog
        await api.patch(`/backlog-installments/${ins.id}`, {
          ...paymentData,
          strategy: 'AUTO_SPLIT',
          im: inputs.im || Math.floor(paidAmt / emi)
        })
      }
      setReceiptNo(''); setChequeNo(''); setNotes(''); setRowInputs({});
      fetchData()
      alert('Payment saved!')
    } catch (ex) { 
      alert('Error: ' + (ex.response?.data?.message || 'Unknown error')) 
    } finally { 
      setSaving(false) }
  }

  const handleDeleteInstallment = async (insId) => {
    try {
      await api.delete(`/backlog-installments/${insId}`)
      setDeleteConfirmId(null)
      fetchData()
    } catch (ex) {
      alert('Delete failed: ' + (ex.response?.data?.message || 'Unknown error'))
    }
  }

  const openEditModal = (ins) => {
    setEditModalIns(ins)
    setEditFields({
      paid_amount: ins.paid_amount || '',
      payment_date: ins.payment_date?.split('T')[0] || '',
      rno: ins.rno || '',
      mode: ins.mode || 'CASH',
      im: ins.im || 1,
      principal_amount: ins.principal_amount || '',
      interest_amount: ins.interest_amount || '',
      fine_amount: ins.fine_amount || 0,
      notes: ins.notes || ''
    })
  }

  const handleEditSave = async () => {
    if (!editModalIns) return
    try {
      await api.patch(`/backlog-installments/${editModalIns.id}`, {
        amount: editFields.paid_amount,
        payment_date: editFields.payment_date,
        rno: editFields.rno,
        mode: editFields.mode,
        im: editFields.im,
        principal_amount: editFields.principal_amount,
        interest_amount: editFields.interest_amount,
        fine_amount: editFields.fine_amount,
        notes: editFields.notes,
        status: 'PAID'
      })
      setEditModalIns(null)
      fetchData()
    } catch (ex) {
      alert('Update failed: ' + (ex.response?.data?.message || 'Unknown error'))
    }
  }

  const getDelay = (ins, pDate) => {
    const today = new Date(pDate);
    if (ins.delay_days !== null && ins.delay_days !== undefined) return ins.delay_days;
    const diff = ins.due_date ? Math.floor((new Date(ins.status === 'PAID' ? (ins.payment_date || today) : today) - new Date(ins.due_date)) / (1000 * 60 * 60 * 24)) : 0;
    return diff > 0 ? diff : 0;
  }

  const updateRowInput = (insId, field, val) => {
    setRowInputs(prev => ({
      ...prev,
      [insId]: { ...(prev[insId] || {}), [field]: val }
    }))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (error || !data || !borrower) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error || 'Data missing'}</div>

  return (
    <div className="bp">
      <style>{CSS}</style>

      <div className="bp-hero">
        <div className="bp-hero-top">
          <div className="bp-avatar">{(borrower.customer_name || 'B').charAt(0)}</div>
          <div>
            <h1 className="bp-name">{borrower.customer_name}</h1>
            <p className="bp-sub">
              FNO: <span>{borrower.fno}</span> • 
              Status: <span style={{ 
                color: borrower.type === 'F' ? '#059669' : (borrower.type === 'S' ? '#dc2626' : '#2563eb'),
                fontWeight: 900 
              }}>
                {borrower.type === 'F' ? 'FINAL/PAID' : (borrower.type === 'S' ? 'SEIZED' : (borrower.type === 'P' ? 'PURCHASE' : 'FINANCE'))}
              </span> • 
              SNO: {borrower.id}
            </p>
          </div>
          <div className="bp-hero-actions">
            <button className="btn btn-primary collect-payment-btn" onClick={() => {
              const first = displayRows.rows.find(r => !r.is_placeholder && r.status !== 'PAID')
              if (first) {
                setSelectedIns(first)
                setIsCollectModalOpen(true)
              } else if (data.summary.balance > 0) {
                // Create a virtual "Balance" installment for the modal
                setSelectedIns({
                  id: 'balance-adj',
                  installment_no: 'BAL',
                  due_date: new Date().toISOString().split('T')[0],
                  installment_amount: data.summary.balance,
                  is_future: true,
                  status: 'PENDING'
                })
                setIsCollectModalOpen(true)
              } else {
                alert("This account is already fully paid!")
              }
            }}><PlusCircle size={14}/> Collect Payment</button>

            <button className="btn btn-settle" disabled={borrower.type === 'F'} onClick={() => {
              if (window.confirm("Are you sure you want to mark this account as SETTLED / FINAL?")) {
                api.post(`/backlog/${id}/settle`, { 
                  settlement_amount: 0, 
                  payment_date: new Date().toISOString().split('T')[0] 
                }).then(() => fetchData())
              }
            }}><CheckCircle size={14}/> {borrower.type === 'F' ? 'Settled' : 'Final Settlement'}</button>

            <button className="btn" style={{ background: '#dc2626', color: 'white', border: 'none' }} disabled={borrower.type === 'S'} onClick={() => {
              if (window.confirm("Are you sure you want to mark this vehicle as SEIZED?")) {
                api.post(`/backlog/${id}/seize`).then(() => fetchData())
              }
            }}><Shield size={14}/> {borrower.type === 'S' ? 'Seized' : 'Seize Vehicle'}</button>
            <button className="btn" onClick={handlePrint}><Printer size={16}/> Print Statement</button>
            <button className="btn" onClick={() => navigate(-1)}><ArrowLeft size={16}/> Back</button>
          </div>
        </div>

        <div className="bp-stats">
          <div className="bp-stat">
            <div className="bp-stat-label">Total Loan</div>
            <div className="bp-stat-val">₹{fmtCurrency(borrower.total_amount)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Total Paid</div>
            <div className="bp-stat-val green">₹{fmtCurrency(data.summary.total_paid)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Balance Owed</div>
            <div className="bp-stat-val red">₹{fmtCurrency(data.summary.balance)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Installments</div>
            <div className="bp-stat-val green">{(data?.account?.installments || []).length} Records</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Monthly Inst.</div>
            <div className="bp-stat-val">₹{fmtCurrency(borrower.installment_amount)}</div>
          </div>
          <div className="bp-stat">
            <div className="bp-stat-label">Interest Rate</div>
            <div className="bp-stat-val">{borrower.interest_rate}% p.a.</div>
          </div>
        </div>
      </div>

      <div className="bp-body">
        <main>
          <div className="bp-card">
            <div className="bp-card-hdr"><CreditCard size={14}/> Legacy Payment Ledger — {borrower.customer_name}</div>
            <div className="bp-card-body" style={{ padding: 0 }}>
              <table className="lt">
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th style={{ width: 80 }}>INS AMT</th>
                    <th style={{ width: 80 }}>DUE DATE</th>
                    <th style={{ width: 45 }}>PRI</th>
                    <th style={{ width: 45 }}>INT</th>
                    <th style={{ width: 100 }}>RNO</th>
                    <th style={{ width: 95 }}>MODE</th>
                    <th style={{ width: 120 }}>PAID DATE</th>
                    <th style={{ width: 85 }}>PAID AMT</th>
                    <th style={{ width: 60 }}>IM</th>
                    <th style={{ width: 55 }}>DELAY</th>
                    <th style={{ width: 65 }}>FINE/D</th>
                    <th style={{ width: 70 }}>FINED</th>
                    <th style={{ width: 85 }}>BAL</th>
                    <th style={{ width: 75 }}>STATUS</th>
                    <th style={{ width: 40 }}>ACT</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.rows.map((ins, idx) => {
                    const isFirstPending = !ins.is_placeholder && displayRows.rows.find(i => !i.is_placeholder && i.status !== 'PAID')?.id === ins.id
                    
                    if (ins.is_placeholder) {
                      return (
                        <tr key={ins.id} id={`row-${ins.id}`} style={{ background: '#f8fafc' }}>
                          <td className="mono" style={{ color: '#94a3b8' }}>{ins.installment_no}</td>
                          <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.parent.installment_amount)}</td>
                          <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                          <td colSpan={13} style={{ fontStyle: 'italic', color: '#94a3b8', paddingLeft: 20 }}>--- Covered by Installment #{ins.parent.installment_no} ---</td>
                        </tr>
                      )
                    }

                    if (ins.is_future && !isFirstPending) {
                      return (
                        <tr key={ins.id} id={`row-${ins.id}`} style={{ opacity: 0.5 }}>
                          <td className="mono" style={{ color: '#94a3b8' }}>{ins.installment_no}</td>
                          <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.installment_amount)}</td>
                          <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                          <td colSpan={13} style={{ fontStyle: 'italic', color: '#94a3b8', paddingLeft: 20 }}>Future Installment</td>
                        </tr>
                      )
                    }

                    const lateDays = getDelay(ins, paymentDate)
                    const inputs = rowInputs[ins.id] || {}
                    const paidAmt = Number(inputs.paid_amount || ins.installment_amount)
                    const emi = Number(ins.installment_amount)
                    const coverageCount = Math.floor(paidAmt / emi)
                    const strategy = inputs.strategy || 'BAL'

                    return (
                      <React.Fragment key={ins.id}>
                        <tr id={`row-${ins.id}`} style={isFirstPending ? { background: '#eff6ff' } : {}}>
                          <td className="mono" style={{ color: '#94a3b8' }}>{ins.installment_no}</td>
                          <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.installment_amount)}</td>
                          {ins.status !== 'PAID' ? (
                            <>
                              <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                              <td className="mono">₹{fmtCurrency(ins.principal_amount || (ins.installment_amount * (borrower.finance_amount / borrower.total_amount)))}</td>
                              <td className="mono">₹{fmtCurrency(ins.interest_amount || (ins.installment_amount - (ins.installment_amount * (borrower.finance_amount / borrower.total_amount))))}</td>
                              <td><input type="text" className="fi" value={isFirstPending ? receiptNo : ''} onChange={e => isFirstPending && setReceiptNo(e.target.value)} placeholder="Ref No" /></td>
                              <td>
                                <select className="fi" value={isFirstPending ? paymentMethod : 'CASH'} onChange={e => isFirstPending && setPaymentMethod(e.target.value)}>
                                  <option>CASH</option>
                                  <option>ONLINE</option>
                                  <option>BANK</option>
                                  <option>CHEQUE</option>
                                </select>
                                {isFirstPending && paymentMethod === 'CHEQUE' && (
                                  <input type="text" className="fi" style={{ marginTop: 4 }} value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque #" />
                                )}
                              </td>
                              <td><input type="date" className="fi" value={isFirstPending ? paymentDate : ''} onChange={e => isFirstPending && setPaymentDate(e.target.value)} /></td>
                              <td>
                                <input type="number" className="fi mono green" style={{ fontSize: 13 }} value={inputs.paid_amount !== undefined ? inputs.paid_amount : Number(ins.installment_amount).toFixed(0)} onChange={e => updateRowInput(ins.id, 'paid_amount', e.target.value)} />
                                {paidAmt > emi && strategy === 'BAL' && (
                                  <div className="breakup-chip">
                                    ₹{paidAmt - emi} Adj in Bal
                                  </div>
                                )}
                              </td>
                              <td><input type="number" className="fi mono" value={inputs.im !== undefined ? inputs.im : (strategy === 'COVER' ? coverageCount : 1)} onChange={e => updateRowInput(ins.id, 'im', e.target.value)} /></td>
                              <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                              <td><input type="number" className="fi" value={inputs.fine_rate ?? 10} onChange={e => updateRowInput(ins.id, 'fine_rate', parseInt(e.target.value) || 0)} /></td>
                              <td className="mono" style={{ fontWeight: 700, color: '#dc2626' }}>₹{fmtCurrency(lateDays * (inputs.fine_rate ?? 10))}</td>
                              <td className="mono" style={{ fontWeight: 700, color: '#0f172a' }}>₹{fmtCurrency((Number(ins.balance || 0) + Number(ins.installment_amount)) + (lateDays * (inputs.fine_rate ?? 10)) - (ins.temp_paid_amount || Number(ins.installment_amount)))}</td>
                              <td><span className="bx bx-paying">PAYING</span></td>
                              <td style={{ display:'flex', alignItems:'center', gap:4 }}>
                                <button className="btn-primary" style={{ padding: '4px 6px', borderRadius: 4 }} disabled={saving || !isFirstPending} onClick={() => handlePayRow(ins)}><Save size={12}/></button>
                                {isFirstPending && (
                                  <div className={`toggle-sw ${advancedMode ? 'on' : ''}`} onClick={() => setAdvancedMode(!advancedMode)}>
                                    <div className="toggle-dot" />
                                  </div>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                              <td className="mono">₹{fmtCurrency(ins.principal_amount)}</td>
                              <td className="mono">₹{fmtCurrency(ins.interest_amount)}</td>
                              <td className="mono" style={{ fontWeight: 700, color: '#6366f1' }}>{ins.rno}</td>
                              <td><span className="bx bx-paid" style={{ background:'#f0fdf4', color:'#15803d' }}>{ins.mode}</span></td>
                              <td className="mono">{fmtDate(ins.payment_date)}</td>
                              <td style={{ fontWeight: 800, color: '#059669' }}>₹{fmtCurrency(ins.paid_amount)}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>{ins.im || 1}</td>

                              <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                              <td className="mono">₹{fmtCurrency(ins.fine_rate || 0)}</td>
                              <td className="mono">₹{fmtCurrency(ins.penalty || 0)}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>₹{fmtCurrency(ins.balance_amount)}</td>
                              <td><span className="badge-paid">✓ PAID</span></td>
                              <td>
                                <div className="act-btns">
                                  <button className="act-btn edit" title="Edit" onClick={() => openEditModal(ins)}><FileText size={12} color="#3b82f6"/></button>
                                  <button className="act-btn del" title="Delete" onClick={() => setDeleteConfirmId(ins.id)}><Trash2 size={12} color="#ef4444"/></button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                        {isFirstPending && advancedMode && (
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={16} style={{ padding: '0 20px 20px' }}>
                              <div className="strategy-box">
                                <Layers size={14} style={{ color: '#6366f1' }}/>
                                <div style={{ fontSize:10, fontWeight:800, color:'#1e293b', flexShrink:0 }}>PAYMENT STRATEGY:</div>
                                <button className={`strategy-btn ${strategy === 'BAL' ? 'active' : ''}`} onClick={() => updateRowInput(ins.id, 'strategy', 'BAL')}>
                                  Adjust in this month (Lower Balance)
                                </button>
                                <button className={`strategy-btn ${strategy === 'COVER' ? 'active' : ''}`} onClick={() => updateRowInput(ins.id, 'strategy', 'COVER')}>
                                  Cover Future Months (Excess Carry)
                                </button>
                                {strategy === 'COVER' && paidAmt > emi && (
                                  <div style={{ marginLeft:'auto', fontSize:11, fontWeight:900, color:'#059669', display:'flex', alignItems:'center', gap:8 }}>
                                    <ArrowDownToLine size={14}/> Breakup: ₹{emi} x {coverageCount} Months {paidAmt % emi > 0 ? `+ ₹${paidAmt % emi} Left` : ''}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
                <tfoot style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #e2e8f0' }}>
                  <tr className="mono" style={{ fontSize: 10 }}>
                    <td style={{ padding: '12px 8px' }}>TOTAL</td>
                    <td style={{ color: '#0f172a' }}>₹{fmtCurrency(displayRows.totals.agreement)}</td>
                    <td></td>
                    <td>₹{fmtCurrency(displayRows.totals.pri)}</td>
                    <td>₹{fmtCurrency(displayRows.totals.int)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style={{ color: '#059669', fontSize: 12 }}>₹{fmtCurrency(displayRows.totals.paid)}</td>
                    <td>{displayRows.totals.inst}</td>
                    <td style={{ color: '#dc2626' }}>{displayRows.totals.late} d</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="bp-stats" style={{ marginTop: 20, border: '1px solid #e2e8f0' }}>
            <div className="bp-stat">
              <div className="bp-stat-label">Total Loan</div>
              <div className="bp-stat-val">₹{fmtCurrency(borrower.total_amount)}</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Total Paid</div>
              <div className="bp-stat-val green">₹{fmtCurrency(data.summary.total_paid)}</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Balance Owed</div>
              <div className="bp-stat-val red">₹{fmtCurrency(data.summary.balance)}</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Installments</div>
              <div className="bp-stat-val green">{(data?.account?.installments || []).length} Records</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Monthly Inst.</div>
              <div className="bp-stat-val">₹{fmtCurrency(borrower.installment_amount)}</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Interest Rate</div>
              <div className="bp-stat-val">{borrower.interest_rate}% p.a.</div>
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
                <div><div className="info-label">Mobile</div><div className="info-val">{borrower.mobile}</div></div>
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

          <div className="bp-card">
            <div className="bp-card-hdr"><Car size={14}/> Asset Details</div>
            <div className="bp-card-body">
              <div style={{ background:'#eff6ff', padding:12, borderRadius:10, border:'1px solid #dbeafe', marginBottom:12 }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#2563eb', letterSpacing:1 }}>{borrower.vehicle_no || 'N/A'}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginTop:4 }}>{borrower.vehicle_model || 'N/A'} • {borrower.vehicle_color || 'N/A'}</div>
              </div>
              <div className="summary-row"><span className="summary-lbl">Chassis</span><span className="summary-val">{borrower.chassis_no || 'N/A'}</span></div>
              <div className="summary-row"><span className="summary-lbl">Engine</span><span className="summary-val">{borrower.engine_no || 'N/A'}</span></div>
              <div className="summary-row"><span className="summary-lbl">Make Year</span><span className="summary-val">{borrower.make_year || 'N/A'}</span></div>
            </div>
          </div>

          <div className="bp-card">
            <div className="bp-card-hdr"><FileText size={14}/> Loan Summary</div>
            <div className="bp-card-body">
              <div className="summary-row"><span className="summary-lbl">Finance Amt</span><span className="summary-val">₹{fmtCurrency(borrower.finance_amount)}</span></div>
              <div className="summary-row"><span className="summary-lbl">Agreement Amt</span><span className="summary-val">₹{fmtCurrency(borrower.total_amount)}</span></div>
              <div className="summary-row"><span className="summary-lbl">HP Amount</span><span className="summary-val">₹{fmtCurrency(borrower.hp_amount || 0)}</span></div>
              <div className="summary-row"><span className="summary-lbl">Interest Amt</span><span className="summary-val">₹{fmtCurrency(borrower.interest_amount)}</span></div>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Installment Modal */}
      {editModalIns && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 520, minHeight: 'auto', borderRadius: 12, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Edit Installment #{editModalIns.installment_no}</h2>
              <button className="act-btn" onClick={() => setEditModalIns(null)}><X size={16}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="fi-group"><label className="fi-lbl">Paid Amount</label><input type="number" className="fi" value={editFields.paid_amount} onChange={e => setEditFields(f => ({...f, paid_amount: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Payment Date</label><input type="date" className="fi" value={editFields.payment_date} onChange={e => setEditFields(f => ({...f, payment_date: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Receipt No.</label><input type="text" className="fi" value={editFields.rno} onChange={e => setEditFields(f => ({...f, rno: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Mode</label><select className="fi" value={editFields.mode} onChange={e => setEditFields(f => ({...f, mode: e.target.value}))}><option>CASH</option><option>ONLINE</option><option>BANK</option><option>CHEQUE</option></select></div>
              <div className="fi-group"><label className="fi-lbl">Principal (PRI)</label><input type="number" className="fi" value={editFields.principal_amount} onChange={e => setEditFields(f => ({...f, principal_amount: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Interest (INT)</label><input type="number" className="fi" value={editFields.interest_amount} onChange={e => setEditFields(f => ({...f, interest_amount: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Coverage (IM)</label><input type="number" className="fi" value={editFields.im} onChange={e => setEditFields(f => ({...f, im: e.target.value}))} /></div>
              <div className="fi-group"><label className="fi-lbl">Fine Amount</label><input type="number" className="fi" value={editFields.fine_amount} onChange={e => setEditFields(f => ({...f, fine_amount: e.target.value}))} /></div>
            </div>
            <div style={{ marginTop: 14 }}><label className="fi-lbl">Notes</label><textarea className="fi" style={{ height: 50, resize: 'none' }} value={editFields.notes} onChange={e => setEditFields(f => ({...f, notes: e.target.value}))} /></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn" style={{ flex: 1, background: '#f1f5f9' }} onClick={() => setEditModalIns(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 380, minHeight: 'auto', borderRadius: 12, padding: 30, textAlign: 'center' }}>
            <Trash2 size={40} color="#ef4444" style={{ margin: '0 auto 16px' }}/>
            <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Delete Installment?</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>This action cannot be undone. The balance will be recalculated automatically.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1, background: '#f1f5f9' }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={() => handleDeleteInstallment(deleteConfirmId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Collect (diff) Modal */}
      {isCollectModalOpen && selectedIns && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 500, minHeight: 'auto', borderRadius: 12, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Collect Payment — Row {selectedIns.installment_no}</h2>
              <button className="btn--sm" onClick={() => setIsCollectModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}><X size={16}/></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="fi-group">
                <label className="fi-lbl">Due Date</label>
                <div className="fi-val-box">{fmtDate(selectedIns.due_date)}</div>
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Inst. Amount</label>
                <div className="fi-val-box">₹{fmtCurrency(selectedIns.installment_amount)}</div>
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Principal (PRI)</label>
                <div className="fi-val-box">₹{fmtCurrency(selectedIns.principal_amount || (selectedIns.installment_amount * (borrower.finance_amount / borrower.total_amount)))}</div>
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Interest (INT)</label>
                <div className="fi-val-box">₹{fmtCurrency(selectedIns.interest_amount || (selectedIns.installment_amount - (selectedIns.installment_amount * (borrower.finance_amount / borrower.total_amount))))}</div>
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Receipt No.</label>
                <input type="text" className="fi" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} placeholder="Enter RNO" />
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Payment Mode</label>
                <select className="fi" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option>CASH</option>
                  <option>ONLINE</option>
                  <option>BANK</option>
                  <option>CHEQUE</option>
                </select>
              </div>

              {paymentMethod === 'CHEQUE' && (
                <div className="fi-group" style={{ gridColumn: 'span 2' }}>
                  <label className="fi-lbl">Cheque Number</label>
                  <input className="fi" value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Enter Cheque Number" />
                </div>
              )}
              <div className="fi-group">
                <label className="fi-lbl">Payment Date</label>
                <input type="date" className="fi" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Paid Amount</label>
                <input type="number" className="fi mono green" value={rowInputs[selectedIns.id]?.paid_amount !== undefined ? rowInputs[selectedIns.id].paid_amount : Number(selectedIns.installment_amount).toFixed(0)} onChange={e => updateRowInput(selectedIns.id, 'paid_amount', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Coverage (IM)</label>
                <input type="number" className="fi" value={rowInputs[selectedIns.id]?.im || 1} onChange={e => updateRowInput(selectedIns.id, 'im', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Fine Per Day</label>
                <input type="number" className="fi" value={rowInputs[selectedIns.id]?.fine_rate ?? 10} onChange={e => updateRowInput(selectedIns.id, 'fine_rate', e.target.value)} />
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Delay Days</label>
                <div className="fi-val-box" style={{ color: getDelay(selectedIns, paymentDate) > 0 ? '#dc2626' : '#059669' }}>
                  {getDelay(selectedIns, paymentDate)} Days
                </div>
              </div>
              <div className="fi-group">
                <label className="fi-lbl">Total Fine (Fined)</label>
                <div className="fi-val-box" style={{ color: '#dc2626', fontWeight: 800 }}>
                  ₹{fmtCurrency(getDelay(selectedIns, paymentDate) * (rowInputs[selectedIns.id]?.fine_rate ?? 10))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <label className="fi-lbl">Notes / Remarks</label>
              <textarea className="fi" style={{ height: 60, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..."></textarea>
            </div>

            <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1, background: '#f1f5f9' }} onClick={() => setIsCollectModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={async () => {
                await handlePayRow(selectedIns)
                setIsCollectModalOpen(false)
              }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual content for printing logic */}
      <div id="statement-print-area" style={{ display: 'none' }}>
        <StatementContent borrower={borrower} displayRows={displayRows} />
      </div>
    </div>
  )
}

function StatementContent({ borrower, displayRows }) {
  return (
    <>
      <div className="st-header">
        <div className="st-company">SHREE SALASAR SARKAR</div>
        <div className="st-address">
          Raipur Road, DHAMTARI (C.G.) 493 773<br/>
          Mobile No.: 9425204738 (Guddu), 9827226081 (Bhanu)
        </div>
        <div className="st-meta">
          <div className="st-title">ACCOUNT STATEMENT</div>
          <div>Folio No.: {borrower.fno}</div>
          <div>Page No.: 1/1</div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-box">
          <div className="st-box-title">Borrower :</div>
          <div className="st-row"><span className="st-lbl">Name</span><span className="st-val">: {borrower.customer_name}</span></div>
          <div className="st-row"><span className="st-lbl">Father's Name</span><span className="st-val">: {borrower.father_name}</span></div>
          <div className="st-row"><span className="st-lbl">Address</span><span className="st-val">: {borrower.address}</span></div>
          <div className="st-row"><span className="st-lbl">Mob./Ph. No.</span><span className="st-val">: {borrower.mobile}</span></div>
        </div>
        <div className="st-box">
          <div className="st-box-title">Guarantor :</div>
          <div className="st-row"><span className="st-lbl">Name</span><span className="st-val">: {borrower.guarantor_name || 'N/A'}</span></div>
          <div className="st-row"><span className="st-lbl">Father's Name</span><span className="st-val">: ---</span></div>
          <div className="st-row"><span className="st-lbl">Address</span><span className="st-val">: ---</span></div>
          <div className="st-row"><span className="st-lbl">Mob./Ph. No.</span><span className="st-val">: ---</span></div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-box">
          <div className="st-box-title">Vehicle :</div>
          <div className="st-row"><span className="st-lbl">New/Used</span><span className="st-val">: {borrower.type === 'P' ? 'NEW' : 'USED'}</span></div>
          <div className="st-row"><span className="st-lbl">Model</span><span className="st-val">: {borrower.vehicle_model}</span></div>
          <div className="st-row"><span className="st-lbl">Color</span><span className="st-val">: {borrower.vehicle_color}</span></div>
          <div className="st-row"><span className="st-lbl">Chassis No.</span><span className="st-val">: {borrower.chassis_no}</span></div>
          <div className="st-row"><span className="st-lbl">Engine No.</span><span className="st-val">: {borrower.engine_no}</span></div>
          <div className="st-row"><span className="st-lbl">Make</span><span className="st-val">: {borrower.vehicle_make}</span></div>
          <div className="st-row"><span className="st-lbl">Vehicle No.</span><span className="st-val">: {borrower.vehicle_no}</span></div>
        </div>
        <div className="st-box">
          <div className="st-box-title">Finance :</div>
          <div className="st-row"><span className="st-lbl">Agreement Date</span><span className="st-val">: {fmtDate(borrower.created_at)}</span></div>
          <div className="st-row"><span className="st-lbl">Total Months</span><span className="st-val">: {borrower.total_months}</span></div>
          <div className="st-row"><span className="st-lbl">Finance Amt.</span><span className="st-val">: {fmtCurrency(borrower.finance_amount)}</span></div>
          <div className="st-row"><span className="st-lbl">Interest Amt.</span><span className="st-val">: {fmtCurrency(borrower.interest_amount)}</span></div>
          <div className="st-row"><span className="st-lbl">Agreement Amt.</span><span className="st-val">: {fmtCurrency(borrower.total_amount)}</span></div>
          <div className="st-row"><span className="st-lbl">HP Amount</span><span className="st-val">: {fmtCurrency(borrower.hp_amount || 0)}</span></div>
          <div className="st-row"><span className="st-lbl">Total Amt.</span><span className="st-val">: {fmtCurrency(borrower.total_amount)}</span></div>
        </div>
      </div>

      <table className="st-table">
        <thead>
          <tr>
            <th>S.NO.</th>
            <th>INSTALMENT AMOUNT</th>
            <th>DUE DATE</th>
            <th>RECEIPT NO.</th>
            <th>PAID AMOUNT</th>
            <th>NO. OF INSTALMENT</th>
            <th>PAID DATE</th>
            <th>PRINCIPAL AMOUNT</th>
            <th>INTEREST AMOUNT</th>
            <th>BALANCE</th>
            <th>DAYS LATE</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.rows.map(ins => {
            if (ins.is_placeholder) {
              return (
                <tr key={ins.id} className="placeholder-row" style={{ background: '#f8fafc' }}>
                  <td className="st-td">{ins.installment_no}</td>
                  <td className="st-td">{fmtCurrency(ins.parent.installment_amount)}</td>
                  <td className="st-td" style={{ color: 'var(--success)' }}>{fmtDate(ins.due_date)}</td>
                  <td className="st-td" colSpan={8} style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>--- Covered by Installment #{ins.parent.installment_no} ---</td>
                </tr>
              )
            }
            const isFuture = ins.is_future;
            const lDays = ins.delay_days !== null ? ins.delay_days : (ins.due_date ? Math.floor((new Date(ins.status === 'PAID' ? (ins.payment_date || new Date()) : new Date()) - new Date(ins.due_date)) / (1000 * 60 * 60 * 24)) : 0);
            const isPaid = ins.status === 'PAID';
            return (
              <tr key={ins.id} style={isFuture ? { color: '#64748b' } : {}}>
                <td>{ins.installment_no}.</td>
                <td>{fmtCurrency(ins.installment_amount)}</td>
                <td>{fmtDate(ins.due_date)}</td>
                <td>{ins.rno || ''}</td>
                <td>{isPaid ? fmtCurrency(ins.paid_amount) : ''}</td>
                <td>{isPaid ? (ins.im || 1) : ''}</td>
                <td>{isPaid ? fmtDate(ins.payment_date) : ''}</td>
                <td>{isPaid ? fmtCurrency(ins.principal_amount) : ''}</td>
                <td>{isPaid ? fmtCurrency(ins.interest_amount) : ''}</td>
                <td>{isPaid ? fmtCurrency(ins.balance_amount) : ''}</td>
                <td>{isPaid && lDays > 0 ? lDays : ''}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="st-total-row">
            <td>Total :</td>
            <td>{fmtCurrency(borrower.total_amount)}</td>
            <td colSpan={2}></td>
            <td>{fmtCurrency(displayRows.totals.paid)}</td>
            <td>{displayRows.totals.inst}</td>
            <td></td>
            <td>{fmtCurrency(displayRows.totals.pri)}</td>
            <td>{fmtCurrency(displayRows.totals.int)}</td>
            <td></td>
            <td>{displayRows.totals.late}</td>
          </tr>
        </tfoot>
      </table>

      <div className="st-footer">
        <div className="st-sig-box">
          <p style={{ flex: 1, paddingRight: 50 }}>
            I am {borrower.customer_name} son of {borrower.father_name}<br/>
            resident {borrower.address}<br/>
            have read the conditions carefully and will pay my installment accordingly. In case of late payment 
            I will pay Rs. 10 per Day per installment. If two consecutive installments are not paid in that case either
            I will surrender the vehicle to you or you can take possession of vehicle by sending your person and in that case 
            I will bear Rs. 1000 as travel expense of your person. After this action you can sell vehicle to recover your amount. 
            After sell of vehicle if any amount would due on my side, I take oath, that I will pay that amount immediately.<br/>
            Note : If installment is paid after due date, late fee Rs. 10 per day per installment will be charged.
          </p>
          <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
            Signature
          </div>
        </div>
      </div>
      <div className="st-credits">
        Software by : MASS, Mobile: 09981511833
      </div>
    </>
  )
}
