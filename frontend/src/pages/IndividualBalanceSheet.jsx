import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'
import api from '../api'

const IndividualBalanceSheet = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/reports/individual-balance/${id}`)
      setData(response.data)
    } catch (err) {
      setError('Failed to load statement.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Statement...</div>
  if (error || !data) return <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>{error || 'Data not found'}</div>

  const { borrower, summary } = data
  // Handle both snake_case and camelCase for relationship names
  const loan = borrower.latest_loan || borrower.latestLoan
  const vehicle = borrower.vehicle
  const guarantor = borrower.guarantor

  const getDaysLate = (dueDate, paidDate) => {
    if (!paidDate || !dueDate) return ''
    const due = new Date(dueDate)
    const paid = new Date(paidDate)
    const diff = Math.floor((paid - due) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : ''
  }

  return (
    <div className="statement-container">
      <style>{`
        .statement-container {
          background-color: #f1f5f9;
          min-height: 100vh;
          padding: 32px 16px;
          font-family: serif;
        }
        .controls {
          max-width: 1000px;
          margin: 0 auto 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .paper {
          max-width: 1000px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid #cbd5e1;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          border-bottom: 3px solid black;
          padding-bottom: 16px;
        }
        .header h1 {
          font-size: 32px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .sub-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
          font-weight: bold;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          margin-bottom: 32px;
          font-size: 15px;
        }
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid black;
          text-align: center;
          font-size: 12px;
          margin-bottom: 32px;
        }
        .ledger-table th, .ledger-table td {
          border: 1px solid black;
          padding: 4px;
        }
        .footer-declaration {
          font-size: 13px;
          font-style: italic;
          line-height: 1.5;
          margin-bottom: 64px;
        }
        .signature-box {
          text-align: center;
          width: 200px;
          margin-left: auto;
        }
        .signature-line {
          border-bottom: 1px solid black;
          height: 60px;
          margin-bottom: 4px;
        }
        @media print {
          .statement-container { background: white; padding: 0; min-height: 0; }
          .controls { display: none; }
          .paper { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; }
        }
      `}</style>

      <div className="controls">
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', color: 'white', padding: '8px 24px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
          <Printer size={18} /> Print Statement
        </button>
      </div>

      <div className="paper">
        <div className="header">
          <h1>SHREE SALASAR SARKAR</h1>
          <p style={{ fontWeight: 'bold', margin: '4px 0' }}>Raipur Road, DHAMTARI (C.G.) 493 773</p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>Mobile No.: 9425204738 (Guddu), 9827226081 (Bhanu)</p>
        </div>

        <div className="sub-header-row">
          <div style={{ fontSize: 20, textTransform: 'uppercase' }}>Borrower</div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>ACCOUNT STATEMENT</h2>
            <div style={{ fontSize: 14 }}>
              <div>Folio No.: {borrower.folio_no}</div>
              <div>Page No.: 1/1</div>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: 24 }} />

        <div className="info-grid">
          <div style={{ lineHeight: 1.6 }}>
            <div><strong>Name:</strong> {borrower.name}</div>
            <div><strong>Father's Name:</strong> {borrower.father_name}</div>
            <div><strong>Address:</strong> {borrower.address}</div>
            <div><strong>Mob/Ph. No.:</strong> {borrower.mobile}{borrower.mobile2 ? `, ${borrower.mobile2}` : ''}</div>
          </div>
          <div style={{ lineHeight: 1.6 }}>
            <div><strong>Guarantor Name:</strong> {guarantor?.name || '—'}</div>
            <div><strong>Father's Name:</strong> {guarantor?.father_name || '—'}</div>
            <div><strong>Address:</strong> {guarantor?.address || '—'}</div>
            <div><strong>Mob/Ph. No.:</strong> {guarantor?.mobile || '—'}</div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid black', margin: '24px 0' }} />

        <div className="info-grid" style={{ fontSize: 14 }}>
          <div>
            <h3 style={{ margin: '0 0 8px', textTransform: 'uppercase', borderBottom: '1px solid black', display: 'inline-block' }}>Vehicle:</h3>
            <div>New/Used: {vehicle?.condition_type || '—'}</div>
            <div>Model: {vehicle?.model || '—'}</div>
            <div>Make: {vehicle?.make_year || '—'}</div>
            <div>Vehicle No.: <strong>{vehicle?.vehicle_no || '—'}</strong></div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', textTransform: 'uppercase', borderBottom: '1px solid black', display: 'inline-block' }}>Finance:</h3>
            <div>Agreement Date: {loan?.agreement_date ? new Date(loan.agreement_date).toLocaleDateString('en-GB') : '—'}</div>
            <div>Total Months: {loan?.total_months}</div>
            <div>Finance Amt: {loan ? Number(loan.finance_amount + loan.agreement_amount + (loan.hire_purchase_rto || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
            <div>Interest Amt: {loan ? Number(loan.interest_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
            <div><strong>Total Amt: {loan ? Number(loan.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</strong></div>
          </div>
        </div>

        <table className="ledger-table">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th>S.No.</th>
              <th>Installment<br/>Amount</th>
              <th>Due Date</th>
              <th>Receipt<br/>No.</th>
              <th>Paid<br/>Amount</th>
              <th>No. of<br/>Installment</th>
              <th>Paid Date</th>
              <th>Principal<br/>Amount</th>
              <th>Interest<br/>Amount</th>
              <th>Balance</th>
              <th>Days Late</th>
            </tr>
          </thead>
          <tbody>
            {loan?.installments.map((ins, idx) => (
              <tr key={ins.id}>
                <td>{idx + 1}</td>
                <td>{Number(ins.amount_due).toFixed(2)}</td>
                <td>{new Date(ins.due_date).toLocaleDateString('en-GB')}</td>
                <td style={{ fontWeight: 'bold' }}>{ins.receipt_no || ''}</td>
                <td style={{ fontWeight: 'bold' }}>{ins.amount_paid > 0 ? Number(ins.amount_paid).toFixed(2) : ''}</td>
                <td>{ins.amount_paid > 0 ? '1' : ''}</td>
                <td>{ins.paid_date ? new Date(ins.paid_date).toLocaleDateString('en-GB') : ''}</td>
                <td>{Number(ins.principal_amount || 0).toFixed(2)}</td>
                <td>{Number(ins.interest_amount || 0).toFixed(2)}</td>
                <td style={{ fontWeight: 'bold' }}>{Number(ins.balance).toLocaleString('en-IN', {  minimumFractionDigits: 2 })}</td>
                <td style={{ color: '#ef4444', fontWeight: 'bold' }}>{getDaysLate(ins.due_date, ins.paid_date)}</td>
              </tr>
            ))}
            {(!loan?.installments || loan.installments.length < 5) && 
              Array(5 - (loan?.installments?.length || 0)).fill(0).map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: 28 }}><td colSpan="11"></td></tr>
              ))
            }
          </tbody>
        </table>

        <div className="footer-declaration">
          <p>
            I am <strong>{borrower.name}</strong> son of <strong>{borrower.father_name}</strong> resident <strong>{borrower.address}</strong> have read the conditions carefully and will pay my installment accordingly.
          </p>
          <p style={{ margin: '12px 0' }}>
            In case of late payment I will pay Rs. 10 per day per installment. If two consecutive installments are not paid, vehicle may be seized.
          </p>
          <p>
            <strong>Note:</strong> If installment is paid after due date, late fee Rs. 10 per day per installment will be charged.
          </p>
        </div>

        <div className="signature-box">
          <div className="signature-line"></div>
          <p style={{ fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>Signature</p>
        </div>
      </div>
    </div>
  )
}

export default IndividualBalanceSheet
