import React from 'react';
import { Printer, X, Download, Share2 } from 'lucide-react';
import { fmtDate, fmtCurrency } from '../utils';

export default function ReceiptModal({ installment, borrower, onClose }) {
  if (!installment || !borrower) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPaid = parseFloat(installment.amount_paid || 0);
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal receipt-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, background: '#fff' }}>
        <div className="modal-header no-print">
          <h3>Payment Receipt</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--outline btn--sm" onClick={handlePrint}>
              <Printer size={16} style={{ marginRight: 6 }} /> Print
            </button>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div id="receipt-content" className="receipt-print-area" style={{ padding: '30px', color: '#000', fontFamily: "'Inter', sans-serif" }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 25, borderBottom: '2px solid #f0f0f0', paddingBottom: 20 }}>
            <h2 style={{ margin: 0, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: 1, fontSize: 24 }}>Shree Salasar Sarkar</h2>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Premium Finance Solutions</div>
            <div style={{ fontSize: 10, marginTop: 4, fontWeight: 600 }}>Dhamtari, Chhattisgarh</div>
          </div>

          {/* Receipt Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 12 }}>
            <div>
              <div style={{ color: '#666', marginBottom: 2 }}>RECEIPT NO</div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{installment.receipt_no || 'NA'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#666', marginBottom: 2 }}>DATE</div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtDate(installment.paid_date || installment.updated_at)}</div>
            </div>
          </div>

          {/* Borrower Details */}
          <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, fontSize: 11 }}>
              <div>
                <div style={{ color: '#666', marginBottom: 2 }}>BORROWER</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{borrower.name}</div>
                <div style={{ opacity: 0.8 }}>Folio: {borrower.folio_prefix}-{borrower.folio_no}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#666', marginBottom: 2 }}>ASSET</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{borrower.vehicle?.vehicle_no || 'NA'}</div>
                <div style={{ opacity: 0.8 }}>{borrower.vehicle?.model || ''}</div>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', color: '#666' }}>DESCRIPTION</th>
                <th style={{ textAlign: 'right', padding: '10px 0', color: '#666' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px 0' }}>
                  <strong>Installment Payment</strong>
                  <div style={{ fontSize: 10, color: '#888' }}>Due Date: {fmtDate(installment.due_date)}</div>
                </td>
                <td style={{ textAlign: 'right', padding: '12px 0' }}>₹{fmtCurrency(installment.amount_due)}</td>
              </tr>
              {parseFloat(installment.penalty) > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--danger)' }}>Late Fee / Penalty</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--danger)' }}>+ ₹{fmtCurrency(installment.penalty)}</td>
                </tr>
              )}
              {parseFloat(installment.discount) > 0 && (
                <tr>
                  <td style={{ padding: '8px 0', color: 'var(--success)' }}>Discount Applied</td>
                  <td style={{ textAlign: 'right', padding: '8px 0', color: 'var(--success)' }}>- ₹{fmtCurrency(installment.discount)}</td>
                </tr>
              )}
              <tr style={{ borderTop: '2px solid #000' }}>
                <td style={{ padding: '15px 0' }}><strong style={{ fontSize: 16 }}>TOTAL RECEIVED</strong></td>
                <td style={{ textAlign: 'right', padding: '15px 0' }}><strong style={{ fontSize: 20 }}>₹{fmtCurrency(totalPaid)}</strong></td>
              </tr>
            </tbody>
          </table>

          {/* Footer Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 11 }}>
            <div>
              <div style={{ color: '#666', marginBottom: 2 }}>PAYMENT METHOD</div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>{installment.method || 'CASH'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#666', marginBottom: 2 }}>STATUS</div>
              <div style={{ color: 'var(--success)', fontWeight: 800 }}>OFFICIALLY VERIFIED</div>
            </div>
          </div>

          {installment.notes && (
            <div style={{ marginTop: 20, fontSize: 10, color: '#666', borderTop: '1px dashed #ddd', paddingTop: 10 }}>
              <strong>Notes:</strong> {installment.notes}
            </div>
          )}

          <div style={{ marginTop: 40, textAlign: 'center', fontSize: 10, opacity: 0.5 }}>
            This is a computer generated receipt. No signature required.
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .receipt-print-area, .receipt-print-area * { visibility: visible; }
            .receipt-print-area { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%;
              padding: 0 !important;
            }
            .no-print { display: none !important; }
            .modal-backdrop { background: none !important; }
            .modal { box-shadow: none !important; border: none !important; position: static !important; width: 100% !important; max-width: 100% !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
