import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';

const LOW_STOCK_THRESHOLD = 5;

const LowStock = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    api
      .get('inventory/')
      .then((res) => {
        const lowStockItems = res.data.filter(
          (inv) => inv.quantity <= LOW_STOCK_THRESHOLD
        );
        setInventory(lowStockItems);
      })
      .catch((err) => console.error('Error fetching low stock:', err));
  }, []);

  // ✅ Filter + sort alphabetically
  const filteredInventory = useMemo(() => {
    return inventory
      .filter(
        (inv) =>
          inv.item.name.toLowerCase().includes(search.toLowerCase()) ||
          inv.branch.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [inventory, search]);

  // ✅ Pagination
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // ✅ Compact pagination with ellipses
  const renderPagination = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
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
            ? 'bg-red-600 text-white'
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
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-700">Low Stock Items</h1>

      <input
        type="text"
        placeholder="Search by item or branch..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1); // ✅ reset page when searching
        }}
        className="p-2 border rounded w-full max-w-md"
      />

      <div className="bg-white rounded-2xl shadow p-4">
        {filteredInventory.length === 0 ? (
          <p className="text-gray-500 italic">No low stock items 🎉</p>
        ) : (
          <>
            <table className="min-w-full text-sm table-auto">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="p-2 text-left">Item Name</th>
                  <th className="p-2 text-left">Branch</th>
                  <th className="p-2 text-left">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((inv, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-2">{inv.item.name}</td>
                    <td className="p-2">{inv.branch.name}</td>
                    <td className="p-2 text-red-600 font-bold">{inv.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ Compact pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LowStock;
