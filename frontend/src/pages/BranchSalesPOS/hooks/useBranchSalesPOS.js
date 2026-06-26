// src/pages/BranchSalesPOS/hooks/useBranchSalesPOS.js
import { useState, useEffect, useMemo } from 'react';
import { fetchInventory, searchInventory } from '../utils/inventoryApi';
import { fetchSales as fetchSalesApi, postSales } from '../utils/salesApi';

function extractArray(resp) {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (resp.results && Array.isArray(resp.results)) return resp.results;
  if (resp.data && Array.isArray(resp.data)) return resp.data;
  return [];
}

function mapRawSale(raw) {
  // raw may be many shapes; normalize into known fields
  const s = raw || {};

  const itemName =
    s.item?.name ||
    s.item_name ||
    s.itemTitle ||
    s.item_title ||
    s.name ||
    (s.item?.title ? s.item.title : undefined) ||
    undefined;

  const item = s.item || (itemName ? { name: itemName } : null);

  const branchName = s.branch?.name || s.branch_name || s.branchTitle || undefined;
  const branch = s.branch || (branchName ? { name: branchName } : null);

  const quantity = Number(s.quantity ?? s.qty ?? s.count ?? 0);

  // total amount could be under several keys
  const total_amount = Number(
    s.total_amount ?? s.total ?? s.amount ?? s.totalAmount ?? 0
  );

  // price may be explicitly returned, or can be derived via total/qty, or fallback to item.price
  let price = undefined;
  if (s.price !== undefined && s.price !== null) price = Number(s.price);
  else if (s.unit_price !== undefined && s.unit_price !== null)
    price = Number(s.unit_price);
  else if (quantity > 0 && total_amount > 0) price = total_amount / quantity;
  else price = Number(s.item?.price ?? s.item_price ?? 0);

  if (!Number.isFinite(price)) price = 0;

  const id = s.id ?? s.pk ?? null;
  const payment_method = s.payment_method ?? s.paymentMethod ?? s.method ?? null;
  const timestamp = s.timestamp ?? s.created_at ?? s.date ?? s.datetime ?? null;

  return {
    id,
    item,
    branch,
    price,
    quantity,
    total_amount,
    payment_method,
    timestamp,
    __raw: s, // keep raw for debugging if needed
  };
}

export default function useBranchSalesPOS(branchId) {
  const [inventory, setInventory] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingCartAction, setLoadingCartAction] = useState(false);
  const [warning, setWarning] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const tax = 0;
  const total = subtotal + tax;

  useEffect(() => {
    (async () => {
      setLoadingSales(true);
      try {
        const salesRaw = await fetchSalesApi(branchId);
        const salesArr = extractArray(salesRaw);
        const mappedSales = salesArr.map((r) => mapRawSale(r));
        // show most recent first
        setSalesHistory(mappedSales.slice(0, 8));

        const inv = await fetchInventory(branchId);
        const mappedInv = inv.map((i) => ({
          inventoryId: i.id,
          itemId: i.item.id,
          name: i.item.name,
          price: parseFloat(i.price),
          quantity: i.quantity,
        }));
        setInventory(mappedInv);
      } catch (err) {
        console.error('useBranchSalesPOS initial load', err);
      } finally {
        setLoadingSales(false);
      }
    })();
  }, [branchId]);

  const addToCart = (option) => {
    if (!option || !option.raw) return;
    const it = option.raw; // already has price from inventory
    setWarning(null);

    setCart((prev) => {
      const existing = prev.find((p) => p.itemId === it.itemId);
      if (existing) {
        if (existing.qty + 1 > it.quantity) {
          setWarning(`Only ${it.quantity} available for ${it.name}`);
          return prev;
        }
        return prev.map((p) =>
          p.itemId === it.itemId ? { ...p, qty: p.qty + 1 } : p
        );
      }
      return [
        ...prev,
        {
          itemId: it.itemId,
          name: it.name,
          price: it.price,
          qty: 1,
          maxQty: it.quantity,
        },
      ];
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

  const changePrice = (itemId, newPrice) => {
    setCart((prev) =>
      prev.map((p) =>
        p.itemId === itemId
          ? { ...p, price: Math.max(0, Number(newPrice) || 0) }
          : p
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((p) => p.itemId !== itemId));
  };

  const completeSale = async () => {
    if (!cart.length) {
      setWarning('Cart is empty');
      return;
    }

    setLoadingCartAction(true);
    setWarning(null);

    try {
      const payloads = cart.map((c) => ({
        item_id: c.itemId,
        branch_id: branchId ? parseInt(branchId) : null,
        quantity: parseInt(c.qty),
        payment_method: paymentMethod,
        price: c.price,
      }));

      const fallbackBranch = localStorage.getItem('branch_id');
      payloads.forEach((p) => {
        if (!p.branch_id) {
          p.branch_id = fallbackBranch ? parseInt(fallbackBranch) : null;
        }
      });

      if (payloads.some((p) => !p.branch_id)) {
        throw new Error('branch_id missing. Cannot complete sale.');
      }

      const results = await postSales(payloads);
      // results may be an array, or { results: [...] }, or [{ data: { ... } }, ...]
      const resultsArr = extractArray(results);

      // Build normalized new sales entries. If API returned wrappers like { data: ... }, extract.
      let newSalesEntries = [];
      if (resultsArr.length > 0) {
        newSalesEntries = resultsArr.map((entry) => {
          const raw = entry.data ?? entry;
          return mapRawSale(raw);
        });
      } else {
        // If API didn't return created objects, create fallback entries from payloads (best-effort)
        newSalesEntries = payloads.map((p) =>
          mapRawSale({
            id: null,
            item: { id: p.item_id, name: inventory.find((i) => i.itemId === p.item_id)?.name ?? `Item ${p.item_id}` },
            branch: { id: p.branch_id, name: null },
            quantity: p.quantity,
            price: p.price,
            total_amount: p.price * p.quantity,
            payment_method: p.payment_method,
            timestamp: new Date().toISOString(),
          })
        );
      }

      // Update inventory defensively based on returned created objects OR payloads
      const updatedInventory = [...inventory];
      if (resultsArr.length > 0) {
        resultsArr.forEach((entry) => {
          const created = entry.data ?? entry;
          const createdItemId = created.item?.id ?? created.item_id ?? created.itemId;
          const createdQty = Number(created.quantity ?? created.qty ?? 0);
          if (!createdItemId) return;
          const idx = updatedInventory.findIndex((inv) => inv.itemId === createdItemId);
          if (idx !== -1) {
            updatedInventory[idx] = {
              ...updatedInventory[idx],
              quantity: Math.max(0, updatedInventory[idx].quantity - createdQty),
            };
          }
        });
      } else {
        payloads.forEach((p) => {
          const idx = updatedInventory.findIndex((inv) => inv.itemId === p.item_id);
          if (idx !== -1) {
            updatedInventory[idx] = {
              ...updatedInventory[idx],
              quantity: Math.max(0, updatedInventory[idx].quantity - (p.quantity || 0)),
            };
          }
        });
      }
      setInventory(updatedInventory);

      // reset cart and open receipt (use normalized entries)
      setCart([]);
      setReceiptData({
        items: newSalesEntries,
        total,
        paymentMethod,
      });
      setReceiptOpen(true);

      // Immediately show new sales in history (most recent first)
      setSalesHistory((prev) => {
        // prepend and keep unique-ish list by id if available
        const combined = [...newSalesEntries, ...prev];
        // optional dedupe by id if id present
        const seen = new Set();
        const deduped = [];
        for (const s of combined) {
          const key = s.id ?? `${s.item?.name}-${s.timestamp}-${s.price}-${s.quantity}`;
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(s);
          }
        }
        return deduped.slice(0, 8);
      });

      // Also refresh from server in background to reconcile authoritative state
      fetchSalesApi(branchId)
        .then((freshResp) => {
          const freshArr = extractArray(freshResp).map((r) => mapRawSale(r));
          setSalesHistory(freshArr.slice(0, 8));
        })
        .catch((err) => console.error('refresh sales after completeSale', err));
    } catch (err) {
      console.error('completeSale', err);
      const message = err.response?.data || err.message || 'Failed to complete sale';
      setWarning(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoadingCartAction(false);
    }
  };

  const loadItemOptions = async (inputValue, callback) => {
    const q = (inputValue || '').trim();
    try {
      const res = await searchInventory(branchId, q);
      const opts = res
        .filter((inv) => inv.quantity > 0)
        .map((inv) => ({
          value: inv.item.id,
          label: `${inv.item.name} — KES ${Number(inv.price).toLocaleString()} (${inv.quantity} in stock)`,
          raw: {
            inventoryId: inv.id,
            itemId: inv.item.id,
            name: inv.item.name,
            price: parseFloat(inv.price),
            quantity: inv.quantity,
          },
        }));
      callback(opts);
    } catch (err) {
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

  const lastSalesList = useMemo(() => salesHistory || [], [salesHistory]);

  return {
    cart,
    subtotal,
    total,
    warning,
    lastSalesList,
    loadingSales,
    loadingCartAction,
    receiptOpen,
    receiptData,
    paymentMethod,
    setPaymentMethod,
    setReceiptOpen,
    addToCart,
    changeQty,
    changePrice,
    removeFromCart,
    completeSale,
    loadItemOptions,
  };
}
