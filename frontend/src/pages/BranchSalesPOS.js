// src/pages/BranchSalesPOS.js
import React, { useState, useEffect, useMemo } from 'react';
import AsyncSelect from 'react-select/async';
import api from '../api/axios';
import { FaPlus, FaTrash, FaPrint } from 'react-icons/fa';
import dayjs from 'dayjs';

const BranchSalesPOS = () => {
  const queryBranchId = new URLSearchParams(window.location.search).get('branch_id');
  const storedBranchId = localStorage.getItem('branch_id');
  const branchId = queryBranchId || storedBranchId || ''; // keep empty for admin mode
  const role = localStorage.getItem('role');

  // state
  const [inventory, setInventory] = useState([]); // local cache fallback
  const [useClientFilter, setUseClientFilter] = useState(false);
  const [cart, setCart] = useState([]); // { itemId, name, price, qty }
  const [loadingCartAction, setLoadingCartAction] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [salesHistory, setSalesHistory] = useState([]); // last few sales shown below
  const [loadingSales, setLoadingSales] = useState(false);
  const [warning, setWarning] = useState(null);

  // Derived totals
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = 0; // leave placeholder if needed
  const total = subtotal + tax;

  // Fetch last sales for quick view
  useEffect(() => {
    fetchSales();
    // if we can't load options via server-side search, we fetch once
    fetchInventoryOnceForFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSales = async () => {
    setLoadingSales(true);
    try {
      const url = branchId ? `sales/?branch_id=${branchId}` : 'sales/';
      const res = await api.get(url);
      setSalesHistory(res.data.slice(0, 8).reverse()); // last few
    } catch (err) {
      console.error('fetchSales', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchInventoryOnceForFallback = async () => {
    try {
      // If the server supports search param we might not need this; it's a fallback.
      const url = branchId ? `inventory/?branch_id=${branchId}` : 'inventory/';
      const res = await api.get(url);
      // map inventory items to useful objects: include item details and quantity
      const list = res.data.map((inv) => ({
        inventoryId: inv.id,
        itemId: inv.item.id,
        name: inv.item.name,
        price: parseFloat(inv.item.price),
        quantity: inv.quantity,
      }));
      setInventory(list);
    } catch (err) {
      console.error('fetchInventoryOnceForFallback', err);
    }
  };

  // Async loader for react-select
  // Tries to ask server for filtered inventory first. If that fails (server doesn't support search), we fallback to client-side filter.
  const loadItemOptions = async (inputValue, callback) => {
    // nothing typed? show top matches (maybe top 25)
    const q = (inputValue || '').trim();

    // If backend supports server-side search, use it.
    try {
      // try server-side search; backend endpoint must accept ?search=...
      const url = branchId
        ? `inventory/?branch_id=${branchId}&search=${encodeURIComponent(q)}`
        : `inventory/?search=${encodeURIComponent(q)}`;

      const res = await api.get(url);

      // If backend returns inventory entries (with item nested), map to options
      if (Array.isArray(res.data)) {
        const opts = res.data
          .filter((inv) => inv.quantity > 0) // hide out-of-stock
          .map((inv) => ({
            value: inv.item.id,
            label: `${inv.item.name} — KES ${Number(inv.item.price).toLocaleString()} (${inv.quantity} in stock)`,
            raw: {
              inventoryId: inv.id,
              itemId: inv.item.id,
              name: inv.item.name,
              price: parseFloat(inv.item.price),
              quantity: inv.quantity,
            },
          }));
        setUseClientFilter(false);
        callback(opts);
        return;
      } else {
        // unexpected shape -> fallback
        throw new Error('Unexpected search response');
      }
    } catch (err) {
      // fallback to client-side filter using cached inventory
      setUseClientFilter(true);
      const filtered = inventory
        .filter((it) => it.quantity > 0 && it.name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 40)
        .map((it) => ({
          value: it.itemId,
          label: `${it.name} — KES ${Number(it.price).toLocaleString()} (${it.quantity} in stock)`,
          raw: it,
        }));
      callback(filtered);
    }
  };

  // Add item to cart with default qty 1 (or increase if exists)
  const addToCart = (option) => {
    if (!option || !option.raw) return;
    const it = option.raw;
    setWarning(null);

    setCart((prev) => {
      const existing = prev.find((p) => p.itemId === it.itemId);
      if (existing) {
        // check stock limit
        if (existing.qty + 1 > it.quantity) {
          setWarning(`Only ${it.quantity} available for ${it.name}`);
          return prev;
        }
        return prev.map((p) => (p.itemId === it.itemId ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { itemId: it.itemId, name: it.name, price: it.price, qty: 1, maxQty: it.quantity }];
    });
  };

  const changeQty = (itemId, newQty) => {
    setCart((prev) =>
      prev.map((p) => {
        if (p.itemId !== itemId) return p;
        const qty = Math.max(1, Number(newQty) || 1);
        if (qty > p.maxQty) {
          setWarning(`Only ${p.maxQty} available for ${p.name}`);
          return p;
        }
        setWarning(null);
        return { ...p, qty };
      })
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((p) => p.itemId !== itemId));
  };

  // Post sale(s) — for now we post one sale per cart item
  const completeSale = async () => {
    if (!cart.length) {
      setWarning('Cart is empty');
      return;
    }

    setLoadingCartAction(true);
    setWarning(null);

    try {
      // Build payloads
      const payloads = cart.map((c) => ({
        item_id: c.itemId,
        branch_id: branchId ? parseInt(branchId) : c.branch_id || null, // should be provided
        quantity: parseInt(c.qty),
      }));

      // If branchId missing and user is branch user, use stored branch id
      if (!payloads.every((p) => p.branch_id)) {
        // try to use localStorage
        const fallbackBranch = localStorage.getItem('branch_id');
        payloads.forEach((p) => {
          if (!p.branch_id) p.branch_id = fallbackBranch ? parseInt(fallbackBranch) : null;
        });
      }

      // Validate branch presence
      if (payloads.some((p) => !p.branch_id)) {
        throw new Error('branch_id missing. Cannot complete sale.');
      }

      // send parallel requests
      const promises = payloads.map((p) => api.post('sales/', p));
      const results = await Promise.all(promises);

      // update UI: reduce local inventory where possible, refresh sales history
      const updatedInventory = [...inventory];
      results.forEach((r) => {
        const created = r.data;
        // r.data should include item and branch and quantity
        // find inventory entry and reduce
        const idx = updatedInventory.findIndex((inv) => inv.itemId === created.item.id && inv.quantity >= 0);
        if (idx !== -1) {
          updatedInventory[idx] = { ...updatedInventory[idx], quantity: Math.max(0, updatedInventory[idx].quantity - created.quantity) };
        }
      });
      setInventory(updatedInventory);
      setCart([]);
      setReceiptData({ items: results.map((r) => r.data), total: total });
      setReceiptOpen(true);
      fetchSales();
    } catch (err) {
      console.error('completeSale', err);
      const message = err.response?.data || err.message || 'Failed to complete sale';
      setWarning(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoadingCartAction(false);
    }
  };

  // Receipt content state
  const [receiptData, setReceiptData] = useState(null);

 const printReceipt = () => {
  const w = window.open('', '_blank', 'width=600,height=800');
  if (!w) return;
  const html = `
    <html>
    <head>
      <title>Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { margin: 10px 0; }
        .logo-container {
          text-align: center;
          margin-bottom: 10px;
        }
        .logo {
          height: 60px;
          width: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        td, th {
          padding: 8px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        .right {
          text-align: right;
        }
      </style>
    </head>
    <body>
      <div class="logo-container">
        <img src="/images/logo.png" alt="Logo" class="logo" />
      </div>
      <h2>Receipt</h2>
      <div><strong>Branch:</strong> ${receiptData?.items?.[0]?.branch?.name || 'N/A'}</div>
      <div><strong>Date:</strong> ${dayjs().format('YYYY-MM-DD HH:mm:ss')}</div>
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th class="right">Price</th></tr>
        </thead>
        <tbody>
          ${receiptData?.items
            .map(
              (s) =>
                `<tr><td>${s.item.name}</td><td>${s.quantity}</td><td class="right">KES ${Number(s.total_amount / s.quantity).toLocaleString()}</td></tr>`
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            <td><strong>Total</strong></td>
            <td class="right"><strong>KES ${Number(receiptData?.total).toLocaleString()}</strong></td>
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


  // small helper to show last few sales list (admin or branch)
  const lastSalesList = useMemo(() => salesHistory || [], [salesHistory]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Branch POS — Fast Sales</h1>
        <div className="text-sm text-gray-600">Branch: {branchId || 'All (admin)'}</div>
      </div>

      {warning && <div className="mb-3 text-red-600">{warning}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: search & inventory quick */}
        <div className="lg:col-span-2 bg-white rounded shadow p-4">
          <h2 className="font-medium mb-3">Add items</h2>

          <AsyncSelect
            cacheOptions
            loadOptions={loadItemOptions}
            onChange={(selected) => addToCart(selected)}
            placeholder="Type to search item (name, barcode, etc.)"
            noOptionsMessage={() => 'No items found'}
            styles={{
              menu: (provided) => ({ ...provided, zIndex: 9999 }), // ensure dropdown over modals
            }}
          />

          <div className="mt-4">
            <h3 className="font-medium mb-2">Cart</h3>
            <div className="space-y-2">
              {cart.length === 0 && <div className="text-gray-500">Cart is empty — add items above</div>}
              {cart.map((c) => (
                <div key={c.itemId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">KES {c.price.toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={c.maxQty}
                      value={c.qty}
                      onChange={(e) => changeQty(c.itemId, e.target.value)}
                      className="w-20 p-1 border rounded text-center"
                    />
                    <div className="w-28 text-right">KES {(c.price * c.qty).toLocaleString()}</div>
                    <button onClick={() => removeFromCart(c.itemId)} className="ml-2 text-red-600">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Subtotal</div>
              <div className="font-bold">KES {Number(subtotal).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={completeSale}
                disabled={loadingCartAction || cart.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loadingCartAction ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>

        {/* right: summary & sales history */}
        <aside className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">Quick totals</h3>
          <div className="mb-3">
            <div className="text-sm text-gray-500">Items in cart</div>
            <div className="font-semibold">{cart.length}</div>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-bold">KES {Number(total).toLocaleString()}</div>
          </div>

          <div className="border-t pt-3 mt-3">
            <h4 className="font-medium mb-2">Recent sales</h4>
            {loadingSales && <div className="text-sm text-gray-500">Loading...</div>}
            {!loadingSales && lastSalesList.length === 0 && <div className="text-sm text-gray-500">No recent sales</div>}
            <ul className="space-y-2 text-sm">
              {lastSalesList.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <div>
                    <div className="font-medium">{s.item.name}</div>
                    <div className="text-xs text-gray-500">{s.branch.name}</div>
                  </div>
                  <div className="text-right">
                    <div>{s.quantity} × KES {Number(s.item.price).toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{dayjs(s.timestamp).format('HH:mm')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Receipt Modal */}
      {receiptOpen && receiptData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-bold">Receipt</h2>
              <div className="flex gap-2">
                <button onClick={printReceipt} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded">
                  <FaPrint /> Print
                </button>
                <button onClick={() => setReceiptOpen(false)} className="px-3 py-2 rounded border">Close</button>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">Branch: {receiptData?.items?.[0]?.branch?.name || 'N/A'}</div>
              <div className="text-sm text-gray-600">Date: {dayjs().format('YYYY-MM-DD HH:mm')}</div>

              <table className="w-full mt-3 text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items.map((r) => (
                    <tr key={r.id}>
                      <td>{r.item.name}</td>
                      <td>{r.quantity}</td>
                      <td className="text-right">KES {Number(r.total_amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td></td>
                    <td className="font-bold">Total</td>
                    <td className="text-right font-bold">KES {Number(receiptData.total).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSalesPOS;
