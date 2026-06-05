import React, { useState, useEffect } from 'react'
import { Printer, RefreshCw, Calendar, Eye, EyeOff, BookOpen } from 'lucide-react'
import api from '../api'
import { fmtCurrency } from '../utils'

export default function Cashbook({ type = 'new' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    narration: 'Yes'
  })

  const load = () => {
    setLoading(true)
    api.get('/cashbook', { params: { start_date: filters.start_date, end_date: filters.end_date, type } })
      .then(r => setData(r.data))
      .catch(e => alert('Failed to fetch cashbook details: ' + (e.response?.data?.message || e.message)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [type])

  const handlePrint = () => {
    window.print()
  }

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  const getTitle = () => {
    if (type === 'new') return 'New Cashbook'
    if (type === 'backlog') return 'Backlog Cashbook'
    return 'Combine Cashbook'
  }

  return (
    <div className="cashbook-page">
      <style>{`
        .cb-toolbar {
          background-color: #d1ebd8;
          border: 2px solid #54a974;
          padding: 12px 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .cb-field {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #1e3f20;
        }
        .cb-input {
          border: 1px solid #7cbfa1;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 13px;
          font-family: inherit;
          color: #1e3f20;
          background: white;
          outline: none;
          font-weight: 600;
        }
        .cb-input:focus {
          border-color: #54a974;
          box-shadow: 0 0 0 2px rgba(84, 169, 116, 0.2);
        }
        .cb-btn {
          background-color: #f1f5f9;
          border: 1px solid #cbd5e1;
          padding: 6px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cb-btn:hover {
          background-color: #e2e8f0;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .cb-btn-primary {
          background-color: #e2f5e9;
          border-color: #7cbfa1;
          color: #1e3f20;
        }
        .cb-btn-primary:hover {
          background-color: #c9ebd4;
          border-color: #54a974;
          color: #112a14;
        }

        .cashbook-table-wrap {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          margin-bottom: 30px;
        }
        .cashbook-table {
          width: 100%;
          border-collapse: collapse;
          background-color: #eaf8ef;
          border: 2px solid #54a974;
          font-size: 13px;
        }
        .cashbook-table th, .cashbook-table td {
          border: 1px solid #7cbfa1;
          padding: 10px 14px;
          color: #1e3f20;
          vertical-align: middle;
        }
        .cashbook-table th {
          background-color: #c9ebd4;
          font-weight: 800;
          text-align: center;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .row-trans:hover td {
          background-color: #def5e6;
        }
        .row-special td {
          font-weight: 800;
          background-color: #d8f1e0;
        }
        .row-footer td {
          font-weight: 900;
          background-color: #b7e3c5;
          border-top: 2px solid #54a974;
          border-bottom: 2px double #54a974;
        }
        
        .td-amount {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
        }
        
        .particulars-header {
          font-weight: 700;
          font-size: 13px;
        }
        .particulars-detail {
          font-size: 11px;
          color: #4a6b51;
          margin-top: 4px;
          padding-left: 12px;
          font-style: italic;
        }

        @media print {
          .no-print, .sidebar, .top-bar, .page-header--mobile {
            display: none !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .page-wrapper {
            padding: 0 !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .cashbook-table {
            background-color: white !important;
            border-color: black !important;
            width: 100% !important;
          }
          .cashbook-table th, .cashbook-table td {
            border-color: black !important;
            color: black !important;
          }
          .cashbook-table th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
          }
          .row-special td {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
          }
          .row-footer td {
            background-color: #e2e8f0 !important;
            -webkit-print-color-adjust: exact;
          }
          .print-header {
            display: block !important;
            margin-bottom: 20px;
          }
          .print-filter-info {
            display: flex !important;
            justify-content: space-between;
            border: 1px solid black;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 15px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1>{getTitle()}</h1>
          <p>{type === 'new' ? 'Daily cash transactions for active loans' : type === 'backlog' ? 'Daily cash transactions for backlog loans' : 'Combined daily cash transactions (Active + Backlog)'}</p>
        </div>
      </div>

      {/* Legacy Filter Bar */}
      <div className="cb-toolbar no-print">
        <div className="cb-field">
          <span>Period :</span>
          <input 
            type="date" 
            className="cb-input" 
            value={filters.start_date} 
            onChange={e => setFilters({ ...filters, start_date: e.target.value })} 
          />
          <span>To</span>
          <input 
            type="date" 
            className="cb-input" 
            value={filters.end_date} 
            onChange={e => setFilters({ ...filters, end_date: e.target.value })} 
          />
        </div>

        <div className="cb-field">
          <span>Narration :</span>
          <select 
            className="cb-input" 
            value={filters.narration} 
            onChange={e => setFilters({ ...filters, narration: e.target.value })}
            style={{ width: '80px' }}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <button className="cb-btn cb-btn-primary" onClick={load} disabled={loading}>
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <BookOpen size={14} />} Ok
        </button>

        <button className="cb-btn" onClick={handlePrint}>
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Print-only Header */}
      <div className="print-header" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 5px 0' }}>SHREE SALASAR SARKAR</h2>
        <h3 style={{ textAlign: 'center', margin: '0 0 15px 0', textDecoration: 'underline' }}>{getTitle().toUpperCase()}</h3>
        <div className="print-filter-info" style={{ display: 'none' }}>
          <div>Period: {formatDateDisplay(filters.start_date)} To {formatDateDisplay(filters.end_date)}</div>
          <div>Narration: {filters.narration}</div>
        </div>
      </div>

      {/* Statement Table */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading cashbook details...
        </div>
      ) : data ? (
        <div className="cashbook-table-wrap">
          <table className="cashbook-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Date</th>
                <th>Particulars</th>
                <th style={{ width: 140 }}>Mode</th>
                <th style={{ width: 140, textAlign: 'right' }}>Debit</th>
                <th style={{ width: 140, textAlign: 'right' }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Opening Balance Row */}
              <tr className="row-special">
                <td></td>
                <td>
                  <div className="particulars-header">Opening Balance :</div>
                </td>
                <td></td>
                <td className="td-amount">
                  {data.opening_balance > 0 ? fmtCurrency(data.opening_balance) : '—'}
                </td>
                <td className="td-amount">—</td>
              </tr>

              {/* 2. Collections List */}
              {data.transactions.map((tx, idx) => (
                <tr key={idx} className="row-trans">
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{tx.date}</td>
                  <td>
                    <div className="particulars-header">{tx.particulars}</div>
                    {filters.narration === 'Yes' && (
                      <div className="particulars-detail">{tx.detail}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{tx.mode}</td>
                  <td className="td-amount">
                    {tx.debit > 0 ? fmtCurrency(tx.debit) : '—'}
                  </td>
                  <td className="td-amount">
                    {tx.credit > 0 ? fmtCurrency(tx.credit) : '—'}
                  </td>
                </tr>
              ))}

              {data.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#4a6b51', fontStyle: 'italic' }}>
                    No collections or receipts recorded in this period.
                  </td>
                </tr>
              )}

              {/* 3. Period Total Row */}
              <tr className="row-special">
                <td></td>
                <td>
                  <div className="particulars-header">Total :</div>
                </td>
                <td></td>
                <td className="td-amount">
                  {data.total_receipts > 0 ? fmtCurrency(data.total_receipts) : '—'}
                </td>
                <td className="td-amount">—</td>
              </tr>

              {/* 4. Closing Balance Row */}
              <tr className="row-special">
                <td></td>
                <td>
                  <div className="particulars-header">Closing Balance :</div>
                </td>
                <td></td>
                <td className="td-amount">—</td>
                <td className="td-amount">
                  {data.closing_balance > 0 ? fmtCurrency(data.closing_balance) : '—'}
                </td>
              </tr>

              {/* 5. balanced Grand Total Row */}
              <tr className="row-footer">
                <td></td>
                <td style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Grand Total</td>
                <td></td>
                <td className="td-amount">
                  {fmtCurrency(data.closing_balance)}
                </td>
                <td className="td-amount">
                  {fmtCurrency(data.closing_balance)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Click "Ok" or choose parameters to query cashbook statement.
        </div>
      )}
    </div>
  )
}
