// src/pages/BranchInventoryView.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

const BranchInventoryView = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const location = useLocation();
  const branchQueryId =
    new URLSearchParams(location.search).get('branch_id') ||
    localStorage.getItem('branch_id');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const url = branchQueryId
          ? `inventory/?branch_id=${branchQueryId}`
          : 'inventory/';
        const response = await api.get(url);
        setItems(response.data);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };

    fetchInventory();
  }, [branchQueryId]);

  const filteredItems = useMemo(() => {
    return items
      .filter((inv) =>
        inv.item.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) =>
        a.item.name.localeCompare(b.item.name, 'en', { sensitivity: 'base' })
      ); // ✅ sort alphabetically
  }, [search, items]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // ✅ Helper to render condensed pagination
  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5; // how many numbers to show around current page

    if (totalPages <= 7) {
      // show all if few pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // always include first and last
      pages.push(1);

      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

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

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-4">Inventory</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // ✅ reset to page 1 when searching
        }}
        className="mb-4 w-full p-2 border rounded"
        placeholder="Search by item name..."
      />

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2">Item Name</th>
              <th className="px-4 py-2">Quantity</th>
              <th className="px-4 py-2">Price (KES)</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((inv) => (
              <tr key={inv.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{inv.item.name}</td>
                <td className="px-4 py-2">{inv.quantity}</td>
                <td className="px-4 py-2">
                  KES {Number(inv.price).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Compact pagination */}
      <div className="flex justify-center gap-2 mt-4">{renderPagination()}</div>
    </div>
  );
};

export default BranchInventoryView;
