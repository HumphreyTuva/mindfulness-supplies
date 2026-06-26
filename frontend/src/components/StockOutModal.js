// src/components/StockOutModal.js
import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const StockOutModal = ({ item, branches, currentBranchId, onClose, onSuccess }) => {
  const [subBranches, setSubBranches] = useState([]);
  const [toBranchId, setToBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch sub-branches for current branch from backend or filter locally
    // For now, assume all branches except current are possible sub-branches
    const subs = branches.filter(b => b.id.toString() !== currentBranchId.toString());
    setSubBranches(subs);
  }, [branches, currentBranchId]);

  const handleStockOut = async (e) => {
    e.preventDefault();
    setError('');
    if (!toBranchId) {
      setError('Please select a sub-branch to send stock to');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    setLoading(true);
    try {
      // API call to stock out
      // Assuming POST /inventory/stockout/ with {from_branch_id, to_branch_id, item_id, quantity}
      await api.post('inventory/stockout/', {
        from_branch_id: currentBranchId,
        to_branch_id: toBranchId,
        item_id: item.id,
        quantity: Number(quantity),
      });

      onSuccess();
    } catch (err) {
      console.error('Stock Out failed:', err);
      setError('Failed to stock out. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <form
        onSubmit={handleStockOut}
        className="bg-white p-6 rounded-lg shadow-md max-w-md w-full"
      >
        <h2 className="text-xl font-semibold mb-4">Stock Out: {item.name}</h2>

        <label className="block mb-2 font-medium">Send To Sub-Branch</label>
        <select
          value={toBranchId}
          onChange={(e) => setToBranchId(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          required
        >
          <option value="">-- Select Sub-Branch --</option>
          {subBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} - {b.location}
            </option>
          ))}
        </select>

        <label className="block mb-2 font-medium">Quantity</label>
        <input
          type="number"
          min="1"
          max={item.quantity} // Optional: prevent sending more than available stock, but your inventory object has quantity
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          placeholder="Enter quantity"
          required
        />

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Stock Out'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockOutModal;
