// src/pages/TrendingStock.js
import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { FaChartLine, FaBoxOpen } from 'react-icons/fa';
import LoadingIndicator from '../components/LoadingIndicator';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SALES_KEY = 'trending_sales_cache_v1';

const TrendingStock = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ----------------------------
  // Cache helpers
  // ----------------------------
  const readCache = () => {
    try {
      const raw = localStorage.getItem(SALES_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to read sales cache:', err);
      return null;
    }
  };

  const writeCache = (value) => {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn('Failed to write sales cache:', err);
    }
  };

  // ----------------------------
  // Fetch sales
  // ----------------------------
  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('sales/');
      setSales(res.data);
      writeCache(res.data);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Load cache first, then backend
  // ----------------------------
  useEffect(() => {
    const cache = readCache();
    if (cache) {
      setSales(cache);
      setLoading(false);
    }
    fetchSales();
  }, []);

  // ----------------------------
  // Filter by time
  // ----------------------------
  const filteredByTime = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const ts = new Date(s.timestamp);
      const daysDiff = (now - ts) / (1000 * 60 * 60 * 24);
      return daysDiff <= Number(timeFilter);
    });
  }, [sales, timeFilter]);

  // ----------------------------
  // Aggregate items
  // ----------------------------
  const aggregated = useMemo(() => {
    const map = {};
    filteredByTime.forEach((s) => {
      const itemName = s.item?.name || 'Unknown Item';
      const branchName = s.branch?.name || 'Unknown Branch';
      const qty = Number(s.quantity) || 0;

      if (!map[itemName]) {
        map[itemName] = { itemName, branches: {}, total: 0 };
      }
      map[itemName].branches[branchName] =
        (map[itemName].branches[branchName] || 0) + qty;
      map[itemName].total += qty;
    });

    return Object.values(map)
      .filter((i) => i.itemName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.total - a.total);
  }, [filteredByTime, search]);

  // ----------------------------
  // Pagination
  // ----------------------------
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return aggregated.slice(start, start + itemsPerPage);
  }, [aggregated, currentPage]);

  const totalPages = Math.ceil(aggregated.length / itemsPerPage);

  // ----------------------------
  // Branch headers
  // ----------------------------
  const allBranches = useMemo(() => {
    const set = new Set();
    aggregated.forEach((i) => {
      Object.keys(i.branches).forEach((b) => set.add(b));
    });
    return Array.from(set).sort();
  }, [aggregated]);

  // ----------------------------
  // Top 5 Bar Chart
  // ----------------------------
  const top5Data = useMemo(() => {
    return aggregated.slice(0, 5).map((i) => ({
      name: i.itemName,
      total: i.total,
    }));
  }, [aggregated]);

  // ----------------------------
  // Rank badge UI
  // ----------------------------
  const rankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-black';
    if (rank === 2) return 'bg-gray-300 text-black';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  // ----------------------------
  // Pagination UI
  // ----------------------------
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

  // ----------------------------
  // Render inside LoadingIndicator
  // ----------------------------
  return (
    <LoadingIndicator
      loading={loading && sales.length === 0}
      text="Fetching sales data..."
      contentOpacity="opacity-80"  // only opacity, no blur
      overlayOpacity="bg-opacity-40"
    >
      <div className="pt-16 md:pt-0 p-4 sm:p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
          <FaChartLine className="text-blue-600" /> Trending Stock
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            type="text"
            placeholder="🔎 Search by item name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="border p-2 rounded w-full sm:w-64"
          />

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="border p-2 rounded w-full sm:w-48"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
        </div>

        {/* Top 5 Graph */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Top 5 Selling Items</h2>

          {top5Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top5Data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="total" fill="#3B82F6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center text-gray-500 py-8">
              <FaBoxOpen className="text-4xl mb-2" />
              <p>No sales data for this period</p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">Rank</th>
                <th className="px-4 py-2">Item Name</th>
                {allBranches.map((b) => (
                  <th key={b} className="px-4 py-2">
                    {b}
                  </th>
                ))}
                <th className="px-4 py-2 text-right">Total Sold</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((row, idx) => {
                const rank = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr
                    key={row.itemName}
                    className="border-t hover:bg-gray-50 odd:bg-gray-50"
                  >
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${rankBadge(
                          rank
                        )}`}
                      >
                        #{rank}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{row.itemName}</td>

                    {allBranches.map((b) => (
                      <td key={b} className="px-4 py-2">
                        {row.branches[b] || 0}
                      </td>
                    ))}

                    <td className="px-4 py-2 font-bold text-right text-blue-700">
                      {row.total}
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={allBranches.length + 3}
                    className="text-center py-8 text-gray-500 flex flex-col items-center gap-2"
                  >
                    <FaBoxOpen className="text-4xl text-gray-400" />
                    <span>No sales found for this period</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {renderPagination()}
          </div>
        )}
      </div>
    </LoadingIndicator>
  );
};

export default TrendingStock;
