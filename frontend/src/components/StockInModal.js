import React, { useState } from 'react';
import api from '../api/axios';

const StockInModal = ({ item, branches, onClose, onSuccess }) => {
  const [targetBranchId, setTargetBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For admin, source branch is the main branch or branch that supplies stock.
  // We will ask admin to select target branch (cannot be the source branch).
  // You can enhance later to select source branch if you have sub-branches.

  // Basic validation: quantity must be positive and branch selected
  const canSubmit = targetBranchId && quantity > 0 && Number.isInteger(+quantity);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      // API call to record stock in for the selected branch and item.
      // Backend should handle reducing stock from the supplying branch automatically.
      await api.post('inventory/stock-in/', {
        branch_id: targetBranchId,
        item_id: item.id,
        quantity: +quantity,
      });

      onSuccess();
    } catch (err) {
      console.error('Stock in error:', err);
      setError(err.response?.data?.detail || 'Failed to stock in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">Stock In: {item.name}</h2>

        {error && <p className="mb-2 text-red-600">{error}</p>}

        <label className="block mb-2 font-medium">Select Branch to Stock In</label>
        <select
          value={targetBranchId}
          onChange={(e) => setTargetBranchId(e.target.value)}
          className="w-full mb-4 border rounded p-2"
          required
        >
          <option value="">-- Select Branch --</option>
          {branches
            .filter(b => b.id !== targetBranchId) // prevent selecting no branch or invalid
            .map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name} - {branch.location}
              </option>
            ))}
        </select>

        <label className="block mb-2 font-medium">Quantity</label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full mb-4 border rounded p-2"
          placeholder="Enter quantity"
          required
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Stocking In...' : 'Stock In'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StockInModal;
