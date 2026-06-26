// src/pages/BranchSalesPOS/ReceiptModal.jsx
import React from 'react';
import { FaPrint } from 'react-icons/fa';
import dayjs from 'dayjs';

export default function ReceiptModal({ receiptData, onClose }) {
  const printReceipt = () => {
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    const html = `
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
          h2 { margin: 10px 0; text-align: center; }
          .logo-container { text-align: center; margin-bottom: 10px; }
          .logo { height: 60px; width: auto; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td, th { padding: 6px; border-bottom: 1px solid #ddd; }
          th { text-align: left; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="logo-container">
          <img src="/images/logo.png" alt="Logo" class="logo" />
        </div>
        <h2>Receipt</h2>
        <div><strong>Branch:</strong> ${receiptData?.items?.[0]?.branch?.name || 'N/A'}</div>
        <div><strong>Date:</strong> ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
        <div><strong>Payment Method:</strong> ${receiptData?.paymentMethod || 'N/A'}</div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${receiptData?.items
              ?.map(
                (s) =>
                  `<tr>
                     <td>${s.item.name}</td>
                     <td>${s.quantity}</td>
                     <td class="right">KES ${Number(s.total_amount / s.quantity).toLocaleString()}</td>
                     <td class="right">KES ${Number(s.total_amount).toLocaleString()}</td>
                   </tr>`
              )
              .join('') || ''}
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td></td>
              <td class="right bold">Grand Total</td>
              <td class="right bold">KES ${Number(receiptData?.total || 0).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-bold">Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={printReceipt}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
            >
              <FaPrint /> Print
            </button>
            <button onClick={onClose} className="px-3 py-2 rounded border">
              Close
            </button>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="mt-4 text-sm">
          <div className="text-gray-600">
            Branch: {receiptData?.items?.[0]?.branch?.name || 'N/A'}
          </div>
          <div className="text-gray-600">
            Date: {dayjs().format('YYYY-MM-DD HH:mm')}
          </div>
          <div className="text-gray-600">
            Payment Method: {receiptData?.paymentMethod || 'N/A'}
          </div>

          <table className="w-full mt-3 border-t text-sm">
            <thead className="text-left text-gray-600 border-b">
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptData?.items?.map((r) => (
                <tr key={r.id} className="border-b">
                  <td>{r.item.name}</td>
                  <td>{r.quantity}</td>
                  <td className="text-right">
                    KES {(r.total_amount / r.quantity).toLocaleString()}
                  </td>
                  <td className="text-right">
                    KES {Number(r.total_amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td></td>
                <td></td>
                <td className="font-bold text-right">Grand Total</td>
                <td className="font-bold text-right">
                  KES {Number(receiptData?.total || 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
