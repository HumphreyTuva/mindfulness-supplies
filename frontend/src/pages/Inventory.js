import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FaPlus } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import LoadingIndicator from "../components/LoadingIndicator"; // ✅ added import

// ----------------------------
// LocalStorage keys
// ----------------------------
const ITEMS_KEY = "inventory_items_v1";
const BRANCHES_KEY = "inventory_branches_v1";
const PRODUCTS_KEY = "inventory_products_v1";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [mainBranchId, setMainBranchId] = useState(null);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ loading state added

  const [formData, setFormData] = useState({
    branch: "",
    item: "",
    quantity: "",
    price: "",
  });

  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const location = useLocation();
  const branchQueryId = new URLSearchParams(location.search).get("branch_id");

  // ----------------------------
  // Helpers to read/write cache
  // ----------------------------
  const readCache = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("Failed to parse cache for", key, err);
      return null;
    }
  };

  const writeCache = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn("Failed to write cache for", key, err);
    }
  };

  // ============================
  // Fetch Inventory
  // ============================
  const fetchInventory = useCallback(async () => {
    setLoading(true); // show spinner when fetching
    try {
      const url = branchQueryId
        ? `inventory/?branch_id=${branchQueryId}`
        : "inventory/";
      const response = await api.get(url);
      setItems(response.data);
      writeCache(ITEMS_KEY, response.data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [branchQueryId]);

  // ============================
  // Fetch Branches
  // ============================
  const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get("branches/");
      setBranches(response.data);
      writeCache(BRANCHES_KEY, response.data);

      if (response.data.length > 0) {
        setMainBranchId(response.data[0].id);

        if (!branchQueryId) {
          setFormData((prev) => ({
            ...prev,
            branch: response.data[0].id,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  }, [branchQueryId]);

  // ============================
  // Fetch Products
  // ============================
  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get("items/");
      setProducts(response.data);
      writeCache(PRODUCTS_KEY, response.data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  }, []);

  // ----------------------------
  // Load cache first, then refresh from backend
  // ----------------------------
  useEffect(() => {
    const cachedItems = readCache(ITEMS_KEY);
    const cachedBranches = readCache(BRANCHES_KEY);
    const cachedProducts = readCache(PRODUCTS_KEY);

    if (cachedItems) setItems(cachedItems);
    if (cachedBranches) {
      setBranches(cachedBranches);
      if (cachedBranches.length > 0) {
        setMainBranchId((prev) => prev ?? cachedBranches[0].id);
        setFormData((prev) => ({
          ...prev,
          branch: prev.branch || (cachedBranches[0] && cachedBranches[0].id) || "",
        }));
      }
    }
    if (cachedProducts) setProducts(cachedProducts);

    fetchInventory();
    fetchBranches();
    fetchItems();

    if (branchQueryId) {
      setFormData((prev) => ({
        ...prev,
        branch: branchQueryId,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchQueryId]);

  // ============================
  // Handle Submit (create / update)
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      item_id: parseInt(formData.item),
      branch_id: parseInt(formData.branch),
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price),
    };

    try {
      const existing = items.find(
        (inv) =>
          inv.item.id === payload.item_id &&
          inv.branch.id === payload.branch_id
      );

      if (existing && !editingItem) {
        const updatedPayload = {
          ...payload,
          quantity: existing.quantity + payload.quantity,
        };

        await api.put(`inventory/${existing.id}/`, updatedPayload);
      } else if (editingItem) {
        await api.put(`inventory/${editingItem.id}/`, payload);
      } else {
        await api.post("inventory/", payload);
      }

      await fetchInventory();

      setFormData({
        branch: mainBranchId || "",
        item: "",
        quantity: "",
        price: "",
      });

      setEditingItem(null);
      setShowModal(false);
    } catch (error) {
      console.error(
        "❌ Failed to submit inventory item:",
        error.response?.data || error.message
      );
    }
  };

  // ============================
  // Handle Delete
  // ============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      await api.delete(`inventory/${id}/`);
      await fetchInventory();
    } catch (error) {
      console.error(
        "❌ Failed to delete inventory item:",
        error.response?.data || error.message
      );
    }
  };

  // ============================
  // Filter & Pagination
  // ============================
  const filteredItems = useMemo(() => {
    return items
      .filter(
        (inv) =>
          inv.item.name.toLowerCase().includes(search.toLowerCase()) ||
          inv.branch.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.item.name.localeCompare(b.item.name));
  }, [search, items]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const renderPagination = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages.map((page, idx) => (
      <button
        key={idx}
        disabled={page === "..."}
        onClick={() => page !== "..." && setCurrentPage(page)}
        className={`px-3 py-1 rounded border text-sm font-medium ${
          page === currentPage
            ? "bg-blue-600 text-white"
            : page === "..."
            ? "cursor-default text-gray-500"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        {page}
      </button>
    ));
  };

  // ============================
  // Render
  // ============================
  return (
    <LoadingIndicator
      loading={loading && items.length === 0}   // ✅ only show loading on FIRST load
      text="Fetching inventory..."
      contentOpacity="opacity-60"
      overlayOpacity="bg-opacity-50"
    >
      <div className="pt-16 md:pt-0 p-4 sm:p-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 className="text-2xl font-semibold text-gray-700">Inventory</h1>

          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                branch: mainBranchId || "",
                item: "",
                quantity: "",
                price: "",
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <FaPlus /> Stock In
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="mb-4 w-full p-2 border rounded"
          placeholder="Search by item or branch..."
        />

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">Item Name</th>
                <th className="px-4 py-2 whitespace-nowrap">Branch</th>
                <th className="px-4 py-2 whitespace-nowrap">Quantity</th>
                <th className="px-4 py-2 whitespace-nowrap">Price (KES)</th>
                <th className="px-4 py-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedItems.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{inv.item.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{inv.branch.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{inv.quantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    KES {Number(inv.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(inv);
                        setFormData({
                          item: inv.item.id,
                          branch: inv.branch.id,
                          quantity: inv.quantity,
                          price: inv.price,
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">{renderPagination()}</div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold mb-4">
                {editingItem ? "Edit Inventory" : "Stock In"}
              </h2>

              {/* Item */}
              <select
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                className="w-full mb-4 border p-2 rounded"
                required
              >
                <option value="">Select Item</option>
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>

              {/* Branch */}
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full mb-4 border p-2 rounded"
                required
              >
                <option value="">Select Branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>

              {/* Quantity */}
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Quantity"
                className="w-full mb-4 border p-2 rounded"
                required
              />

              {/* Price */}
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Price (KES)"
                className="w-full mb-4 border p-2 rounded"
                required
              />

              {/* Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  {editingItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </LoadingIndicator>
  );
};

export default Inventory;
