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

  .bp-details-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; padding:20px 20px 0; max-width:1800px; margin:0 auto; }
  @media (max-width: 1024px) { .bp-details-grid { grid-template-columns:repeat(2, 1fr); } }
  @media (max-width: 640px) { .bp-details-grid { grid-template-columns:1fr; } }

  .bp-body { display:grid;grid-template-columns:1fr;gap:20px;padding:20px;max-width:1800px;margin:0 auto; }
  .bp-card { background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .bp-card-hdr { padding:10px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#64748b;display:flex;align-items:center;gap:8px; }
  .bp-card-body { padding:16px; }

  .lt { width:100%;border-collapse:collapse;font-size:11px; min-width: 1100px; border: 1px solid #e2e8f0; }
  .lt th { background:#f8fafc;padding:10px 8px;text-align:left;font-weight:800;color:#64748b;border:1px solid #e2e8f0;white-space:nowrap;font-size:9px;text-transform:uppercase;letter-spacing:0.5px;overflow:hidden; }
  .lt td { padding:8px;border:1px solid #e2e8f0;vertical-align:middle;color:#334155; }
  
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

  .lt tbody tr:hover td { background: #f0f9ff !important; }
  .lt tbody tr:nth-child(even) td { background: #fafbfc; }
  .lt tbody tr.row-paid td { border-left: 3px solid #10b981; }
  .lt tbody tr.row-paying td { border-left: 3px solid #3b82f6; background: #eff6ff !important; }
  .lt tbody tr.row-placeholder td { border-left: 3px solid #e2e8f0; }
  .lt tbody tr.row-future td { border-left: 3px solid #f59e0b; opacity: 0.55; }
  .lt td { transition: background 0.15s; }

  .badge-paid { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;background:#d1fae5;color:#065f46;letter-spacing:0.3px; }
  .badge-pending { display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:800;background:#fef3c7;color:#92400e; }
  .badge-mode { display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#ede9fe;color:#5b21b6; }
  .badge-cov { display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;font-size:10px;font-weight:700;background:#e0f2fe;color:#0369a1; }

  .act-btn { display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;transition:all 0.15s; }
  .act-btn:hover { transform:scale(1.1); }
  .act-btn.edit:hover { background:#eff6ff;border-color:#3b82f6; }
  .act-btn.del:hover { background:#fef2f2;border-color:#ef4444; }
  .act-btns { display:flex;gap:4px;align-items:center; }
`;

export default function InteractiveLedger({ profileId, onBack }) {
  const { id: routeId } = useParams()
  const id = profileId || routeId
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getDelay = (ins, pDate) => {
    const today = new Date(pDate);
    if (ins.delay_days !== null && ins.delay_days !== undefined) return ins.delay_days;
    const diff = ins.due_date ? Math.floor((new Date(ins.status === 'PAID' ? (ins.paid_date || today) : today) - new Date(ins.due_date)) / (1000 * 60 * 60 * 24)) : 0;
    return diff > 0 ? diff : 0;
  }
  
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
  const summary = data?.summary

  const displayRows = useMemo(() => {
    const raw = loan?.installments || []
    const sorted = [...raw].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    const rows = []
    let tPaid = 0, tInst = 0, tPri = 0, tInt = 0, tLate = 0;

    // Use actual DB installments. We don't hide them here but we replicate the styling.
    const processedRnos = new Set();
    const primaryPayments = new Map();

    sorted.forEach((ins, idx) => {
        const insNo = ins.installment_no || (idx + 1);
        const rno = ins.receipt_no || '';
        
        // Detect if this is a cascaded placeholder row (e.g. "RNO-1")
        const isPlaceholder = rno.includes('-');
        const baseRno = isPlaceholder ? rno.split('-')[0] : rno;

        let rowObj = {
            ...ins,
            installment_no: insNo,
            is_placeholder: isPlaceholder,
            balance: 0
        };

        if (ins.status === 'PAID') {
            if (!isPlaceholder) {
                // This is a primary payment row
                primaryPayments.set(rno, rowObj);
                rowObj.display_paid_amt = Number(ins.amount_paid || 0);
                rowObj.display_im = 1;
                rows.push(rowObj);
            } else {
                // This is a placeholder row
                const parent = primaryPayments.get(baseRno);
                if (parent) {
                    parent.display_paid_amt += Number(ins.amount_paid || 0);
                    parent.display_im += 1;
                    rowObj.parent_no = parent.installment_no;
                }
                rows.push(rowObj);
            }

            tPaid += Number(ins.amount_paid || 0);
            tInst += 1;
            tPri += Number(ins.principal_amount || 0);
            tInt += Number(ins.interest_amount || 0);
            const lDays = getDelay(ins, paymentDate);
            tLate += (lDays > 0 ? lDays : 0);
        } else {
            rows.push(rowObj);
        }
    })

    let realBal = loan?.total_amount - tPaid;
    let virtualBal = realBal; // Used to decide if we need MORE rows
    
    rows.forEach(r => {
        r.balance = realBal; // Current balance at this row
        if (r.status === 'PAID') {
            // Already subtracted from realBal at start
        } else {
            // Pending rows will reduce the VIRTUAL balance because they are 'scheduled'
            virtualBal -= Number(r.amount_due || 0);
        }
    })

    let m = rows.length + 1
    const totalMonths = loan?.total_months || 0
    const baseDate = rows.length > 0 ? new Date(rows[0].due_date) : new Date()

    // Add future rows if we haven't reached the original duration 
    // OR if there is still a REAL balance that isn't covered by any pending installment
    while (m <= totalMonths || virtualBal > 1) {
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + (m - 1))
        rows.push({
            id: `future-${m}`,
            installment_no: m,
            due_date: d.toISOString().split('T')[0],
            amount_due: loan?.installment_amount || 0,
            is_future: true,
            status: 'PENDING',
            balance: realBal
        })
        virtualBal -= Number(loan?.installment_amount || 0)
        m++
        if (m > 500) break;
    }

    const tAgr = rows.filter(r => !r.is_placeholder).reduce((sum, r) => sum + Number(r.amount_due || 0), 0)
    return { rows, totals: { agreement: tAgr, paid: tPaid, inst: tInst, pri: tPri, int: tInt, late: tLate } }
  }, [data, loan, summary, paymentDate])

  const handlePayRow = async (ins) => {
    const inputs = rowInputs[ins.id] || {}
    const paidAmt = Number(inputs.paid_amount || ins.amount_due)
    const im = inputs.im || 1
    const fineRate = inputs.fine_rate || 10
    const delay = getDelay(ins, paymentDate)

    if (!paidAmt || paidAmt <= 0) return alert('Enter a valid amount.')
    
    setSaving(true)
    try {
      const isBAL = ins.id === 'balance-adj'
      const payload = {
        paid_date: paymentDate,
        amount_collected: paidAmt,
        method: paymentMethod,
        receipt_no: receiptNo,
        notes: notes,
        penalty: delay * fineRate,
        strategy: isBAL ? 'BAL' : (im > 1 ? 'AUTO_SPLIT' : 'AUTO_SPLIT'),
        cheque_no: paymentMethod === 'CHEQUE' ? chequeNo : ''
      }

      const isFuture = ins.is_future || String(ins.id).startsWith('future-') || isBAL;

      if (isFuture) {
         await api.post(`/loans/${id}/add-payment`, {
           paid_date: paymentDate,
           amount: paidAmt,
           method: paymentMethod,
           receipt_no: receiptNo,
           cheque_no: chequeNo,
           notes: notes,
           penalty: delay * fineRate,
           due_date: ins.due_date
         })
         setReceiptNo(''); setChequeNo(''); setNotes(''); setRowInputs({}); setIsCollectModalOpen(false);
         fetchData();
         alert('Payment recorded successfully!');
         return;
      }

      await api.patch(`/installments/${ins.id}/pay`, payload)
      
      setReceiptNo(''); setNotes(''); setRowInputs({}); setIsCollectModalOpen(false);
      fetchData()
      alert('Payment saved!')
    } catch (ex) { 
      alert('Error: ' + (ex.response?.data?.message || 'Unknown error')) 
    } finally { 
      setSaving(false) 
    }
  }

  const handleDeleteInstallment = async (insId) => {
    try {
      await api.patch(`/installments/${insId}/unpay`)
      setDeleteConfirmId(null)
      fetchData()
    } catch (ex) {
      alert('Delete failed: ' + (ex.response?.data?.message || 'Unknown error'))
    }
  }

  const handleEditSave = async () => {
    if (!editModalIns) return
    try {
      await api.patch(`/installments/${editModalIns.id}/edit-payment`, {
        amount_paid: editFields.paid_amount,
        paid_date: editFields.payment_date,
        receipt_no: editFields.rno,
        method: editFields.mode,
        principal_amount: editFields.principal_amount,
        interest_amount: editFields.interest_amount,
        penalty: editFields.fine_amount,
        im: editFields.im,
        notes: editFields.notes
      })
      setEditModalIns(null)
      fetchData()
    } catch (ex) {
      alert('Update failed: ' + (ex.response?.data?.message || 'Unknown error'))
    }
  }



  const updateRowInput = (insId, field, val) => {
    setRowInputs(prev => ({
      ...prev,
      [insId]: { ...(prev[insId] || {}), [field]: val }
    }))
  }

  const handlePrint = () => {
    const printArea = document.getElementById('statement-print-area');
    if (!printArea) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    printWindow.document.write(`
      <html>
        <head>
          <title>Account Statement - ${borrower.name}</title>
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

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
  if (error || !data || !borrower) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>{error || 'Data missing'}</div>

  return (
    <div className="bp">
      <style>{CSS}</style>

      <div className="bp-hero">
        <div className="bp-hero-top">
          <div className="bp-avatar">{(borrower.name || 'B').charAt(0)}</div>
          <div>
            <h1 className="bp-name">{borrower.name}</h1>
            <p className="bp-sub">
              FNO: <span>{borrower.folio_no}</span> • 
              Status: <span style={{ 
                color: loan?.status === 'FINAL' ? '#059669' : (loan?.status === 'SEIZED' ? '#dc2626' : '#2563eb'),
                fontWeight: 900,
                textTransform: 'uppercase'
              }}>
                {loan?.status || 'ACTIVE'}
              </span> • 
              SNO: {borrower.id}
            </p>
          </div>
          <div className="bp-hero-actions">
            <button className="btn btn-primary" disabled={loan?.status === 'FINAL' || loan?.status === 'SEIZED'} onClick={() => {
                const first = displayRows.rows.find(r => r.status !== 'PAID')
                if (first) { setSelectedIns(first); setIsCollectModalOpen(true); }
            }}><PlusCircle size={14}/> Collect Payment</button>
            
            <button className="btn btn-settle" disabled={loan?.status === 'FINAL'} onClick={() => {
              if (window.confirm("Are you sure you want to mark this account as SETTLED / FINAL?")) {
                api.post(`/loans/${loan?.id}/settle`, { notes: 'Final Settlement' }).then(() => fetchData())
              }
            }}><CheckCircle size={14}/> {loan?.status === 'FINAL' ? 'Settled' : 'Settlement'}</button>

            <button className="btn" style={{ background: '#dc2626', color: 'white', border: 'none' }} disabled={loan?.status === 'SEIZED'} onClick={() => {
              if (window.confirm("Are you sure you want to mark this vehicle as SEIZED?")) {
                api.post(`/loans/${loan?.id}/seize`).then(() => fetchData())
              }
            }}><Shield size={14}/> {loan?.status === 'SEIZED' ? 'Seized' : 'Seize Vehicle'}</button>

            <button className="btn" onClick={handlePrint}><Printer size={16}/> Print Statement</button>
            <button className="btn" onClick={() => onBack ? onBack() : navigate(-1)}><ArrowLeft size={16}/> Back</button>
          </div>
        </div>

        <div className="bp-stats">
          <div className="bp-stat"><div className="bp-stat-label">Total Loan</div><div className="bp-stat-val">₹{fmtCurrency(loan?.total_amount)}</div></div>
          <div className="bp-stat"><div className="bp-stat-label">Total Paid</div><div className="bp-stat-val green">₹{fmtCurrency(summary?.total_paid)}</div></div>
          <div className="bp-stat"><div className="bp-stat-label">Balance Owed</div><div className="bp-stat-val red">₹{fmtCurrency(summary?.balance)}</div></div>
          <div className="bp-stat"><div className="bp-stat-label">Installments</div><div className="bp-stat-val">{loan?.installments?.length} Records</div></div>
          <div className="bp-stat"><div className="bp-stat-label">Monthly Inst.</div><div className="bp-stat-val">₹{fmtCurrency(loan?.installment_amount || loan?.emi_amount)}</div></div>
          <div className="bp-stat"><div className="bp-stat-label">Interest Rate</div><div className="bp-stat-val">{loan?.interest_rate}% p.a.</div></div>
        </div>
      </div>

      <div className="bp-details-grid">
        {/* Card 1: Identity & Contact */}
        <div className="bp-card">
          <div className="bp-card-hdr"><User size={14}/> Identity & Contact</div>
          <div className="bp-card-body">
            <div className="info-row"><div className="info-ic"><User size={14}/></div><div><div className="info-label">Father</div><div className="info-val">{borrower.father_name || 'N/A'}</div></div></div>
            <div className="info-row"><div className="info-ic"><Smartphone size={14}/></div><div><div className="info-label">Mobile</div><div className="info-val">{borrower.mobile}</div></div></div>
            <div className="info-row"><div className="info-ic"><MapPin size={14}/></div><div><div className="info-label">Address</div><div className="info-val">{borrower.address || 'N/A'}</div></div></div>
          </div>
        </div>

        {/* Card 2: Guarantor Details */}
        <div className="bp-card">
          <div className="bp-card-hdr"><User size={14}/> Guarantor Details</div>
          <div className="bp-card-body">
            <div className="info-row"><div className="info-ic"><User size={14}/></div><div><div className="info-label">Guarantor Name</div><div className="info-val">{borrower.guarantor?.name || 'N/A'}</div></div></div>
            <div className="info-row"><div className="info-ic"><Smartphone size={14}/></div><div><div className="info-label">Guarantor Mobile</div><div className="info-val">{borrower.guarantor?.mobile || 'N/A'}</div></div></div>
            <div className="info-row"><div className="info-ic"><MapPin size={14}/></div><div><div className="info-label">Guarantor Address</div><div className="info-val">{borrower.guarantor?.address || 'N/A'}</div></div></div>
          </div>
        </div>

        {/* Card 3: Asset Details */}
        <div className="bp-card">
          <div className="bp-card-hdr"><Car size={14}/> Asset Details</div>
          <div className="bp-card-body">
            <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#2563eb' }}>{borrower.vehicle?.reg_no || 'N/A'}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{borrower.vehicle?.model || 'N/A'}</div>
            </div>
            <div className="summary-row"><span className="summary-lbl">Chassis</span><span className="summary-val">{borrower.vehicle?.chassis_no || 'N/A'}</span></div>
            <div className="summary-row"><span className="summary-lbl">Engine</span><span className="summary-val">{borrower.vehicle?.engine_no || 'N/A'}</span></div>
          </div>
        </div>

        {/* Card 4: Loan Summary */}
        <div className="bp-card">
          <div className="bp-card-hdr"><FileText size={14}/> Loan Summary</div>
          <div className="bp-card-body">
            <div className="summary-row"><span className="summary-lbl">Finance Amt</span><span className="summary-val">₹{fmtCurrency(loan?.finance_amount)}</span></div>
            <div className="summary-row"><span className="summary-lbl">Interest Rate</span><span className="summary-val">{loan?.interest_rate}% p.a.</span></div>
            <div className="summary-row"><span className="summary-lbl">EMI Amount</span><span className="summary-val">₹{fmtCurrency(loan?.installment_amount || loan?.emi_amount)}</span></div>
            <div className="summary-row"><span className="summary-lbl">Total Agreement</span><span className="summary-val">₹{fmtCurrency(loan?.total_amount)}</span></div>
          </div>
        </div>
      </div>

      <div className="bp-body">
        <main>
          <div className="bp-card">
            <div className="bp-card-hdr"><CreditCard size={14}/> PAYMENT LEDGER — {borrower.name}</div>
            <div className="bp-card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="lt" style={{ minWidth: 1200 }}>
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
                    const isFirstPending = displayRows.rows.find(i => i.status !== 'PAID')?.id === ins.id
                    const lateDays = getDelay(ins, paymentDate)
                    const inputs = rowInputs[ins.id] || {}

                    if (ins.is_placeholder) {
                        return (
                          <tr key={ins.id} id={`row-${ins.id}`} className="row-placeholder" style={{ background: '#f8fafc' }}>
                            <td className="mono" style={{ color: '#94a3b8' }}>{ins.installment_no}</td>
                            <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.amount_due)}</td>
                            <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                            <td colSpan={13} style={{ fontStyle: 'italic', color: '#94a3b8', paddingLeft: 20 }}>
                                --- Covered by Installment #{ins.parent_no} ---
                            </td>
                          </tr>
                        )
                    }

                    return (
                      <React.Fragment key={ins.id}>
                        <tr id={`row-${ins.id}`} className={ins.status === 'PAID' ? 'row-paid' : (isFirstPending ? 'row-paying' : '')}>
                          <td className="mono">{ins.installment_no}</td>
                          <td style={{ fontWeight: 800 }}>₹{fmtCurrency(ins.amount_due)}</td>
                          {ins.status !== 'PAID' ? (
                            <>
                              <td className="mono" style={{ color: '#059669', fontWeight: 600 }}>{fmtDate(ins.due_date)}</td>
                              <td className="mono">₹{fmtCurrency(ins.principal_amount)}</td>
                              <td className="mono">₹{fmtCurrency(ins.interest_amount)}</td>
                              <td><input className="fi" value={isFirstPending ? receiptNo : ''} onChange={e => isFirstPending && setReceiptNo(e.target.value)} placeholder="Ref No" /></td>
                              <td>
                                <select className="fi" value={isFirstPending ? paymentMethod : 'CASH'} onChange={e => isFirstPending && setPaymentMethod(e.target.value)}>
                                  <option>CASH</option><option>ONLINE</option><option>BANK</option><option>CHEQUE</option>
                                </select>
                                {isFirstPending && paymentMethod === 'CHEQUE' && (
                                  <input className="fi" style={{ marginTop: 4 }} value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Cheque #" />
                                )}
                              </td>
                              <td><input type="date" className="fi" value={isFirstPending ? paymentDate : ''} onChange={e => isFirstPending && setPaymentDate(e.target.value)} /></td>
                              <td><input type="number" className="fi mono green" value={inputs.paid_amount ?? Number(ins.amount_due).toFixed(0)} onChange={e => updateRowInput(ins.id, 'paid_amount', e.target.value)} /></td>
                              <td><input type="number" className="fi mono" value={inputs.im ?? 1} onChange={e => {
                                const newIm = parseInt(e.target.value) || 1;
                                const newPaidAmt = Number(ins.amount_due) * newIm;
                                setRowInputs(prev => ({ ...prev, [ins.id]: { ...(prev[ins.id] || {}), im: newIm, paid_amount: newPaidAmt } }));
                              }} /></td>
                              <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                              <td><input type="number" className="fi" value={inputs.fine_rate ?? 10} onChange={e => updateRowInput(ins.id, 'fine_rate', e.target.value)} /></td>
                              <td className="mono" style={{ color: '#dc2626', fontWeight: 700 }}>₹{fmtCurrency(lateDays * (inputs.fine_rate ?? 10))}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>₹{fmtCurrency(ins.balance)}</td>
                              <td><span className="bx bx-paying">PAYING</span></td>
                              <td><button className="act-btn" onClick={() => handlePayRow(ins)} disabled={saving}>{saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12}/>}</button></td>
                            </>
                          ) : (
                            <>
                              <td className="mono">{fmtDate(ins.due_date)}</td>
                              <td className="mono">₹{fmtCurrency(ins.principal_amount)}</td>
                              <td className="mono">₹{fmtCurrency(ins.interest_amount)}</td>
                              <td className="mono" style={{ color: '#6366f1', fontWeight: 700 }}>{ins.receipt_no}</td>
                              <td><span className="badge-mode">{ins.method}</span></td>
                              <td className="mono">{fmtDate(ins.paid_date)}</td>
                              <td className="mono" style={{ color: '#059669', fontWeight: 800 }}>₹{fmtCurrency(ins.display_paid_amt || ins.amount_paid)}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>{ins.display_im || 1}</td>
                              <td><div className={lateDays > 0 ? "delay-tag" : "delay-none"}>{lateDays} d</div></td>
                              <td className="mono">₹{fmtCurrency(ins.fine_rate || 0)}</td>
                              <td className="mono">₹{fmtCurrency(ins.penalty || 0)}</td>
                              <td className="mono" style={{ fontWeight: 700 }}>₹{fmtCurrency(ins.balance)}</td>
                              <td><span className="badge-paid">✓ PAID</span></td>
                              <td>
                                <div className="act-btns">
                                  <button className="act-btn edit" onClick={() => {
                                    setEditModalIns(ins);
                                    setEditFields({
                                      paid_amount: ins.amount_paid,
                                      payment_date: ins.paid_date,
                                      rno: ins.receipt_no,
                                      mode: ins.method,
                                      principal_amount: ins.principal_amount,
                                      interest_amount: ins.interest_amount,
                                      fine_amount: ins.penalty,
                                      im: ins.im || 1,
                                      notes: ins.notes
                                    })
                                  }}><FileText size={12} color="#3b82f6"/></button>
                                  <button className="act-btn del" onClick={() => setDeleteConfirmId(ins.id)}><Trash2 size={12} color="#ef4444"/></button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
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
              <div className="bp-stat-val">₹{fmtCurrency(loan?.total_amount)}</div>
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
              <div className="bp-stat-val green">{loan?.installments?.length || 0} Records</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Monthly Inst.</div>
              <div className="bp-stat-val">₹{fmtCurrency(loan?.installment_amount)}</div>
            </div>
            <div className="bp-stat">
              <div className="bp-stat-label">Interest Rate</div>
              <div className="bp-stat-val">{loan?.interest_rate}% p.a.</div>
            </div>
          </div>
        </main>
      </div>

      {isCollectModalOpen && selectedIns && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 600, minHeight: 'auto', borderRadius: 12, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Collect Payment — Row {selectedIns.installment_no}</h2>
              <button className="act-btn" onClick={() => setIsCollectModalOpen(false)}><X size={16}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="fi-group"><label className="fi-lbl">Due Date</label><div className="fi-val-box">{fmtDate(selectedIns.due_date)}</div></div>
              <div className="fi-group"><label className="fi-lbl">Inst. Amount</label><div className="fi-val-box">₹{fmtCurrency(selectedIns.amount_due)}</div></div>
              
              <div className="fi-group"><label className="fi-lbl">Principal (PRI)</label><div className="fi-val-box">₹{fmtCurrency(selectedIns.principal_amount)}</div></div>
              <div className="fi-group"><label className="fi-lbl">Interest (INT)</label><div className="fi-val-box">₹{fmtCurrency(selectedIns.interest_amount)}</div></div>

              <div className="fi-group"><label className="fi-lbl">Receipt No.</label><input className="fi" value={receiptNo} onChange={e => setReceiptNo(e.target.value)} placeholder="Enter RNO" /></div>
              <div className="fi-group">
                <label className="fi-lbl">Payment Mode</label>
                <select className="fi" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option>CASH</option><option>ONLINE</option><option>BANK</option><option>CHEQUE</option>
                </select>
              </div>

              {paymentMethod === 'CHEQUE' && (
                <div className="fi-group" style={{ gridColumn: 'span 2' }}>
                  <label className="fi-lbl">Cheque Number</label>
                  <input className="fi" value={chequeNo} onChange={e => setChequeNo(e.target.value)} placeholder="Enter Cheque Number" />
                </div>
              )}
              
              <div className="fi-group"><label className="fi-lbl">Payment Date</label><input type="date" className="fi" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} /></div>
              <div className="fi-group"><label className="fi-lbl">Paid Amount</label><input type="number" className="fi" value={rowInputs[selectedIns.id]?.paid_amount ?? Number(selectedIns.amount_due).toFixed(0)} onChange={e => updateRowInput(selectedIns.id, 'paid_amount', e.target.value)} /></div>
              
              <div className="fi-group"><label className="fi-lbl">Coverage (IM)</label><input type="number" className="fi" value={rowInputs[selectedIns.id]?.im ?? 1} onChange={e => {
                const newIm = parseInt(e.target.value) || 1;
                const newPaidAmt = Number(selectedIns.amount_due) * newIm;
                setRowInputs(prev => ({ ...prev, [selectedIns.id]: { ...(prev[selectedIns.id] || {}), im: newIm, paid_amount: newPaidAmt } }));
              }} /></div>
              <div className="fi-group"><label className="fi-lbl">Fine Per Day</label><input type="number" className="fi" value={rowInputs[selectedIns.id]?.fine_rate ?? 10} onChange={e => updateRowInput(selectedIns.id, 'fine_rate', e.target.value)} /></div>
              
              <div className="fi-group"><label className="fi-lbl">Delay Days</label><div className="fi-val-box" style={{ color: getDelay(selectedIns, paymentDate) > 0 ? '#dc2626' : '#059669' }}>{getDelay(selectedIns, paymentDate)} Days</div></div>
              <div className="fi-group"><label className="fi-lbl">Total Fine (Fined)</label><div className="fi-val-box" style={{ color: '#dc2626' }}>₹{fmtCurrency(getDelay(selectedIns, paymentDate) * (rowInputs[selectedIns.id]?.fine_rate ?? 10))}</div></div>
            </div>

            <div className="fi-group" style={{ marginTop: 15 }}>
                <label className="fi-lbl">Notes / Remarks</label>
                <textarea className="fi" style={{ height: 60, resize: 'none' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional notes..."></textarea>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setIsCollectModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => handlePayRow(selectedIns)} disabled={saving}>{saving ? 'Saving...' : 'Save Payment'}</button>
            </div>
          </div>
        </div>
      )}

      {editModalIns && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 520, minHeight: 'auto', borderRadius: 12, padding: 30 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Edit Payment #{editModalIns.installment_no}</h2>
              <button className="act-btn" onClick={() => setEditModalIns(null)}><X size={16}/></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="fi-group"><label className="fi-lbl">Paid Amount</label><input type="number" className="fi" value={editFields.paid_amount} onChange={e => setEditFields({...editFields, paid_amount: e.target.value})} /></div>
                <div className="fi-group"><label className="fi-lbl">Payment Date</label><input type="date" className="fi" value={editFields.payment_date} onChange={e => setEditFields({...editFields, payment_date: e.target.value})} /></div>
                <div className="fi-group"><label className="fi-lbl">Receipt No</label><input className="fi" value={editFields.rno} onChange={e => setEditFields({...editFields, rno: e.target.value})} /></div>
                <div className="fi-group">
                  <label className="fi-lbl">Mode</label>
                  <select className="fi" value={editFields.mode} onChange={e => setEditFields({...editFields, mode: e.target.value})}>
                    <option>CASH</option><option>ONLINE</option><option>BANK</option><option>CHEQUE</option>
                  </select>
                </div>

                <div className="fi-group"><label className="fi-lbl">Principal (PRI)</label><input type="number" className="fi" value={editFields.principal_amount} onChange={e => setEditFields({...editFields, principal_amount: e.target.value})} /></div>
                <div className="fi-group"><label className="fi-lbl">Interest (INT)</label><input type="number" className="fi" value={editFields.interest_amount} onChange={e => setEditFields({...editFields, interest_amount: e.target.value})} /></div>

                <div className="fi-group"><label className="fi-lbl">Coverage (IM)</label><input type="number" className="fi" value={editFields.im} onChange={e => setEditFields({...editFields, im: e.target.value})} /></div>
                <div className="fi-group"><label className="fi-lbl">Fine Amount</label><input type="number" className="fi" value={editFields.fine_amount} onChange={e => setEditFields({...editFields, fine_amount: e.target.value})} /></div>
            </div>
            <div className="fi-group" style={{ marginTop: 15 }}>
              <label className="fi-lbl">Notes / Remarks</label>
              <textarea className="fi" style={{ height: 60, resize: 'none' }} value={editFields.notes} onChange={e => setEditFields({...editFields, notes: e.target.value})} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setEditModalIns(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="preview-overlay">
          <div className="preview-cnt" style={{ width: 380, minHeight: 'auto', borderRadius: 12, padding: 30, textAlign: 'center' }}>
            <Trash2 size={40} color="#ef4444" style={{ margin: '0 auto 16px' }}/>
            <h3>Unpay Installment?</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>This will mark the installment as unpaid.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={() => handleDeleteInstallment(deleteConfirmId)}>Yes, Unpay</button>
            </div>
          </div>
        </div>
      )}

      {/* Actual content for printing logic */}
      <div id="statement-print-area" style={{ display: 'none' }}>
        <StatementContent borrower={borrower} loan={loan} displayRows={displayRows} />
      </div>
    </div>
  )
}

function StatementContent({ borrower, loan, displayRows }) {
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
          <div>Folio No.: {borrower.folio_no}</div>
          <div>Page No.: 1/1</div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-box">
          <div className="st-box-title">Borrower :</div>
          <div className="st-row"><span className="st-lbl">Name</span><span className="st-val">: {borrower.name}</span></div>
          <div className="st-row"><span className="st-lbl">Father's Name</span><span className="st-val">: {borrower.father_name}</span></div>
          <div className="st-row"><span className="st-lbl">Address</span><span className="st-val">: {borrower.address}</span></div>
          <div className="st-row"><span className="st-lbl">Mob./Ph. No.</span><span className="st-val">: {borrower.mobile}</span></div>
        </div>
        <div className="st-box">
          <div className="st-box-title">Guarantor :</div>
          <div className="st-row"><span className="st-lbl">Name</span><span className="st-val">: {borrower.guarantor?.name || 'N/A'}</span></div>
          <div className="st-row"><span className="st-lbl">Father's Name</span><span className="st-val">: {borrower.guarantor?.father_name || '---'}</span></div>
          <div className="st-row"><span className="st-lbl">Address</span><span className="st-val">: {borrower.guarantor?.address || '---'}</span></div>
          <div className="st-row"><span className="st-lbl">Mob./Ph. No.</span><span className="st-val">: {borrower.guarantor?.mobile || '---'}</span></div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-box">
          <div className="st-box-title">Vehicle :</div>
          <div className="st-row"><span className="st-lbl">Reg No.</span><span className="st-val">: {borrower.vehicle?.reg_no || 'N/A'}</span></div>
          <div className="st-row"><span className="st-lbl">Model</span><span className="st-val">: {borrower.vehicle?.model || 'N/A'}</span></div>
          <div className="st-row"><span className="st-lbl">Chassis No.</span><span className="st-val">: {borrower.vehicle?.chassis_no || 'N/A'}</span></div>
          <div className="st-row"><span className="st-lbl">Engine No.</span><span className="st-val">: {borrower.vehicle?.engine_no || 'N/A'}</span></div>
        </div>
        <div className="st-box">
          <div className="st-box-title">Finance :</div>
          <div className="st-row"><span className="st-lbl">Agreement Date</span><span className="st-val">: {fmtDate(loan?.agreement_date)}</span></div>
          <div className="st-row"><span className="st-lbl">Total Months</span><span className="st-val">: {loan?.total_months}</span></div>
          <div className="st-row"><span className="st-lbl">Finance Amt.</span><span className="st-val">: {fmtCurrency(loan?.finance_amount)}</span></div>
          <div className="st-row"><span className="st-lbl">Interest Rate</span><span className="st-val">: {loan?.interest_rate}%</span></div>
          <div className="st-row"><span className="st-lbl">Agreement Amt.</span><span className="st-val">: {fmtCurrency(loan?.total_amount)}</span></div>
          <div className="st-row"><span className="st-lbl">EMI Amount</span><span className="st-val">: {fmtCurrency(loan?.installment_amount)}</span></div>
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
                  <td className="st-td">{fmtCurrency(ins.amount_due)}</td>
                  <td className="st-td" style={{ color: 'var(--success)' }}>{fmtDate(ins.due_date)}</td>
                  <td className="st-td" colSpan={7} style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>--- Covered by Installment #{ins.parent_no} ---</td>
                </tr>
              )
            }
            const isPaid = ins.status === 'PAID';
            const lDays = isPaid ? Math.floor((new Date(ins.paid_date) - new Date(ins.due_date)) / (1000 * 60 * 60 * 24)) : 0;
            return (
              <tr key={ins.id}>
                <td>{ins.installment_no}.</td>
                <td>{fmtCurrency(ins.amount_due)}</td>
                <td>{fmtDate(ins.due_date)}</td>
                <td>{ins.receipt_no || ''}</td>
                <td>{isPaid ? fmtCurrency(ins.amount_paid) : ''}</td>
                <td>{isPaid ? fmtDate(ins.paid_date) : ''}</td>
                <td>{isPaid ? fmtCurrency(ins.principal_amount) : ''}</td>
                <td>{isPaid ? fmtCurrency(ins.interest_amount) : ''}</td>
                <td>{fmtCurrency(ins.balance)}</td>
                <td>{isPaid && lDays > 0 ? lDays : ''}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="st-total-row">
            <td>Total :</td>
            <td>{fmtCurrency(loan?.total_amount)}</td>
            <td colSpan={2}></td>
            <td>{fmtCurrency(displayRows.totals.paid)}</td>
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
            I am {borrower.name} son of {borrower.father_name}<br/>
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
