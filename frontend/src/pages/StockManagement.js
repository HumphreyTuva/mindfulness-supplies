// src/pages/StockManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import StockInModal from '../components/StockInModal';
import StockOutModal from '../components/StockOutModal';

const StockManagement = () => {
  const role = localStorage.getItem('role');
  const userBranchId = localStorage.getItem('branch_id');

  const [branches, setBranches] = useState([]);
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(
    role === 'admin' ? '' : userBranchId
  );
  const [search, setSearch] = useState('');

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals control
  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    fetchBranches();
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedBranchId) fetchInventory(selectedBranchId);
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const res = await api.get('branches/');
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get('items/');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  const fetchInventory = async (branchId) => {
    try {
      const res = await api.get(`inventory/?branch_id=${branchId}`);
      setInventory(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  // ✅ Filter + Sort alphabetically
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((inv) =>
        inv.item.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) =>
        a.item.name.localeCompare(b.item.name, 'en', { sensitivity: 'base' })
      );
  }, [search, inventory]);

  // ✅ Pagination logic
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const renderPagination = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((page, idx) => (
      <button
        key={idx}
        disabled={page === '...'}
        onClick={() => page !== '...' && setCurrentPage(page)}
        className={`px-3 py-1 rounded border text-sm font-medium ${
          page === currentPage
            ? 'bg-blue-600 text-white'
            : page === '...'
            ? 'cursor-default text-gray-500'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        {page}
      </button>
    ));
  };

  // Modals handlers
  const handleOpenStockIn = (item) => {
    if (role !== 'admin') return;
    setCurrentItem(item);
    setShowStockIn(true);
  };

  const handleOpenStockOut = (item) => {
    if (!selectedBranchId) return;
    setCurrentItem(item);
    setShowStockOut(true);
  };

  const refreshInventory = () => {
    if (selectedBranchId) fetchInventory(selectedBranchId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6">Stock Management</h1>

      {/* Branch selector */}
      {role === 'admin' && (
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Branch</label>
          <select
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              setCurrentPage(1); // ✅ reset to first page
            }}
            className="border rounded px-3 py-2 w-full max-w-xs"
          >
            <option value="">-- Select Branch --</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} - {b.location}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="mb-6 p-2 border rounded w-full max-w-md"
      />

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Stock Balance</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInventory.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">
                  No stock found
                </td>
              </tr>
            )}
            {paginatedInventory.map((inv) => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{inv.item.name}</td>
                <td className="p-3">{inv.quantity}</td>
                <td className="p-3 flex gap-4">
                  {role === 'admin' && (
                    <button
                      onClick={() => handleOpenStockIn(inv.item)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Stock In
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenStockOut(inv.item)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Stock Out
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {renderPagination()}
        </div>
      )}

      {/* Modals */}
      {showStockIn && currentItem && (
        <StockInModal
          item={currentItem}
          branches={branches}
          onClose={() => setShowStockIn(false)}
          onSuccess={() => {
            setShowStockIn(false);
            refreshInventory();
          }}
        />
      )}

      {showStockOut && currentItem && (
        <StockOutModal
          item={currentItem}
          branches={branches}
          currentBranchId={selectedBranchId}
          onClose={() => setShowStockOut(false)}
          onSuccess={() => {
            setShowStockOut(false);
            refreshInventory();
          }}
        />
      )}
    </div>
  );
};

export default StockManagement;
