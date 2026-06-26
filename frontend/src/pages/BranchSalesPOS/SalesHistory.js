// src/pages/BranchSalesPOS/SalesHistory.jsx
import React, { useEffect, useMemo } from 'react';
import dayjs from 'dayjs';

const toNum = (v) => (typeof v === 'number' ? v : Number(v ?? 0));
const fmtKES = (n) => (Number.isFinite(n) ? `KES ${n.toLocaleString()}` : 'KES 0');

export default function SalesHistory({ sales = [], loading }) {
  // Sort sales newest → oldest based on timestamp
  const sortedSales = useMemo(() => {
    return [...(sales || [])].sort((a, b) => {
      const ta = new Date(
        a.timestamp ?? a.created_at ?? a.date ?? a.datetime ?? 0
      ).getTime();
      const tb = new Date(
        b.timestamp ?? b.created_at ?? b.date ?? b.datetime ?? 0
      ).getTime();
      return tb - ta; // descending (newest first)
    });
  }, [sales]);

  // Dev-only: peek at one record to confirm shape
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && sortedSales?.length) {
      // eslint-disable-next-line no-console
      console.debug('SalesHistory sample sale:', sortedSales[0]);
    }
  }, [sortedSales]);

  return (
    <div>
      <h4 className="font-medium mb-2">Recent sales</h4>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {!loading && (!sortedSales || sortedSales.length === 0) && (
        <div className="text-sm text-gray-500">No recent sales</div>
      )}

      <ul className="space-y-2 text-sm">
        {sortedSales.map((s, idx) => {
          // Quantity
          const qty = toNum(s.quantity ?? s.qty);

          // Prefer explicit sale price; else derive from total_amount/quantity; else fallback to item's price.
          const explicitPrice = toNum(s.price);
          const totalFromApi = toNum(
            s.total_amount ?? s.total ?? s.amount ?? s.totalAmount
          );
          const derivedUnit =
            qty > 0 && totalFromApi > 0 ? totalFromApi / qty : NaN;
          const itemPrice = toNum(s.item?.price);

          const unitPrice =
            Number.isFinite(explicitPrice) && explicitPrice > 0
              ? explicitPrice
              : Number.isFinite(derivedUnit)
              ? derivedUnit
              : itemPrice;

          // Total: prefer API total if present; else compute qty * unitPrice
          const total =
            Number.isFinite(totalFromApi) && totalFromApi > 0
              ? totalFromApi
              : Number.isFinite(unitPrice) && qty > 0
              ? unitPrice * qty
              : NaN;

          // Names & time
          const itemName =
            s.item?.name ?? s.item_name ?? s.item?.title ?? 'Unknown Item';
          const branchName =
            s.branch?.name ?? s.branch_name ?? 'Unknown Branch';
          const ts =
            s.timestamp ?? s.created_at ?? s.date ?? s.datetime ?? null;
          const timeStr = ts
            ? dayjs(ts).format('HH:mm')
            : dayjs().format('HH:mm');

          // Stable key even if id missing
          const key = s.id ?? `${itemName}-${ts ?? ''}-${idx}`;

          return (
            <li key={key} className="flex justify-between">
              <div>
                <div className="font-medium">{itemName}</div>
                <div className="text-xs text-gray-500">{branchName}</div>
                <div className="text-xs text-gray-400">
                  Payment: {s.payment_method || 'N/A'}
                </div>
              </div>

              <div className="text-right">
                <div>
                  {(qty || qty === 0) ? qty : '-'} × {fmtKES(unitPrice)}
                </div>
                <div className="text-xs text-gray-400">{timeStr}</div>
                <div className="text-xs font-medium text-gray-600">
                  Total: {fmtKES(total)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
