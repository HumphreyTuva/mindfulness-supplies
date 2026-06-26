// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { FaBox, FaCashRegister, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import dayjs from 'dayjs';

// ======================= DEFAULT PLACEHOLDER DATA =======================
const defaultInventory = [
  { id: 1, name: "Kichinjioni-Main", quantity: 9860, branch: { id: 1 } },
  { id: 2, name: "Watamu", quantity: 511, branch: { id: 2 } },
  { id: 3, name: "Kitale", quantity: 6198, branch: { id: 3 } },
  { id: 4, name: "Likoni", quantity: 2423, branch: { id: 4 } },
  { id: 5, name: "Tezo", quantity: 2911, branch: { id: 5 } },
  { id: 6, name: "Mtondia", quantity: 830, branch: { id: 6 } },
  { id: 7, name: "Chumani", quantity: 2154, branch: { id: 7 } },
  { id: 8, name: "Gabriel Likoni", quantity: 482, branch: { id: 8 } },
  { id: 9, name: "Ocean Palace", quantity: 92, branch: { id: 9 } },
];

const defaultSales = [
  { id: 1, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 1 } },
  { id: 2, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 2 } },
  { id: 3, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 3 } },
  { id: 4, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 4 } },
  { id: 5, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 5 } },
  { id: 6, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 6 } },
  { id: 7, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 7 } },
  { id: 8, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 8 } },
  { id: 9, quantity: 0, total_amount: "0", timestamp: dayjs().format("YYYY-MM-DD"), branch: { id: 9 } },
];

const defaultBranches = [
  { id: 1, name: "Kichinjioni-Main", location: "..." },
  { id: 2, name: "Watamu", location: "..." },
  { id: 3, name: "Kitale", location: "..." },
  { id: 4, name: "Likoni", location: "..." },
  { id: 5, name: "Tezo", location: "..." },
  { id: 6, name: "Mtondia", location: "..." },
  { id: 7, name: "Chumani", location: "..." },
  { id: 8, name: "Gabriel Likoni", location: "..." },
  { id: 9, name: "Ocean Palace", location: "..." }
];

// ======================= HOOK: COUNT UP TO TARGET =======================
const useCountUpToTarget = (target, duration = 8000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = count;
    let animationFrame;

    const step = () => {
      start += Math.max((target - start) / 10, 1); // smooth increment
      if (start < target) {
        setCount(Math.floor(start));
        animationFrame = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    step();

    return () => cancelAnimationFrame(animationFrame);
  }, [target]);

  return count;
};

// ======================= DASHBOARD COMPONENT =======================
const Dashboard = () => {
  const navigate = useNavigate();
  const userKey = `dashboardCache_${localStorage.getItem('userId') || 'guest'}`;
  const cachedData = JSON.parse(localStorage.getItem(userKey)) || {};

const normalizeList = (list) => {
  if (Array.isArray(list)) return list;
  if (list?.results && Array.isArray(list.results)) return list.results;
  if (list?.data && Array.isArray(list.data)) return list.data;
  return [];
};

const [inventory, setInventory] = useState(normalizeList(cachedData.inventory) || defaultInventory);
const [sales, setSales] = useState(normalizeList(cachedData.sales) || defaultSales);
const [branches, setBranches] = useState(normalizeList(cachedData.branches) || defaultBranches);

  // ======================= FETCH DATA =======================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, salesRes, branchesRes] = await Promise.all([
          api.get('inventory/'),
          api.get('sales/'),
          api.get('branches/'),
        ]);
        const fetchedInventory = normalizeList(invRes.data);
        const fetchedSales = normalizeList(salesRes.data);
        const fetchedBranches = normalizeList(branchesRes.data);

        setInventory(fetchedInventory);
        setSales(fetchedSales);
        setBranches(fetchedBranches);

        localStorage.setItem(userKey, JSON.stringify({
          inventory: fetchedInventory,
          sales: fetchedSales,
          branches: fetchedBranches,
        }));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, [userKey]);

  // ======================= CALCULATIONS =======================
  const today = dayjs().format('YYYY-MM-DD');

  const totalStockTarget = useMemo(() => inventory.reduce((sum, item) => sum + item.quantity, 0), [inventory]);
  const todaySalesTarget = useMemo(() => sales.filter(s => dayjs(s.timestamp).format('YYYY-MM-DD') === today)
    .reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0), [sales, today]);

  const animatedStock = useCountUpToTarget(totalStockTarget);
  const animatedSales = useCountUpToTarget(todaySalesTarget);

  const lowStockCount = useMemo(() => inventory.filter(i => i.quantity <= 5).length, [inventory]);

  const sortedBranchStats = useMemo(() => {
    return branches
      .map(branch => {
        const branchInventory = inventory.filter(i => i.branch.id === branch.id);
        const stock = branchInventory.reduce((sum, i) => sum + i.quantity, 0);

        const branchSales = sales.filter(s => s.branch.id === branch.id && dayjs(s.timestamp).format('YYYY-MM-DD') === today);
        const soldQty = branchSales.reduce((sum, s) => sum + s.quantity, 0);
        const soldAmount = branchSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

        return { id: branch.id, name: branch.name, location: branch.location, stock, soldQty, soldAmount };
      })
      .sort((a, b) => b.soldAmount - a.soldAmount);
  }, [branches, inventory, sales, today]);

  // ======================= SUMMARY CARDS =======================
  const summaryCards = [
    { title: 'Total Stock', value: `${animatedStock.toLocaleString()} Items`, icon: <FaBox className="text-blue-600 text-2xl" /> },
    { title: "Today's Sales", value: `KES ${animatedSales.toLocaleString()}`, icon: <FaCashRegister className="text-green-600 text-2xl" /> },
    { title: 'Low Stock Alerts', value: <button onClick={() => navigate('/low-stock')} className="text-red-600 hover:underline">{lowStockCount} Items</button>, icon: <FaExclamationTriangle className="text-red-600 text-2xl" /> }
  ];

  // ======================= RENDER =======================
  return (
    <div className="pt-16 md:pt-0 p-4 sm:p-6 space-y-6">

      <h1 className="text-2xl font-semibold text-gray-700">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <div key={index} className="flex items-center space-x-4 bg-white rounded-2xl shadow p-4">
            {card.icon}
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="font-bold text-lg">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Table */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Branch Overview</h2>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm table-auto">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-2 text-left">Branch Name</th>
                <th className="p-2 text-left">Items in Stock</th>
                <th className="p-2 text-left">Items Sold Today</th>
                <th className="p-2 text-left">Sales Amount (KES)</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBranchStats.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{b.name}</td>
                  <td className="p-2">{b.stock}</td>
                  <td className="p-2">{b.soldQty}</td>
                  <td className="p-2 font-bold text-green-600">KES {b.soldAmount.toLocaleString()}</td>
                  <td className="p-2 text-center space-x-2">
                    <button onClick={() => navigate(`/inventory?branch_id=${b.id}`)} className="text-blue-600 hover:underline">View Inventory</button>
                    <button onClick={() => navigate(`/sales?branch_id=${b.id}`)} className="text-green-600 hover:underline">View Sales</button>
                  </td>
                </tr>
              ))}
              {sortedBranchStats.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500 italic">No branch data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
