import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../api/axios';
import LoadingIndicator from '../components/LoadingIndicator';

// LocalStorage key
const ITEMS_KEY = 'items_cache_v1';

const Items = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ name: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ----------------------------
  // Cache helpers
  // ----------------------------
  const readCache = () => {
    try {
      const raw = localStorage.getItem(ITEMS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Failed to read items cache:', err);
      return null;
    }
  };

  const writeCache = (value) => {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn('Failed to write items cache:', err);
    }
  };

  // ----------------------------
  // Fetch items
  // ----------------------------
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('items/');
      setItems(res.data);
      writeCache(res.data);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // Load cache first, then fetch from backend
  // ----------------------------
  useEffect(() => {
    const cachedItems = readCache();
    if (cachedItems) {
      setItems(cachedItems);
      setLoading(false);
    }
    fetchItems();
  }, []);

  // ----------------------------
  // Save / Update item
  // ----------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`items/${editingItem.id}/`, form);
      } else {
        await api.post('items/', form);
      }
      await fetchItems();
      closeModal();
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  // ----------------------------
  // Delete item
  // ----------------------------
  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await api.delete(`items/${id}/`);
        await fetchItems();
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  // ----------------------------
  // Open / Close modal
  // ----------------------------
  const openModal = (item = null) => {
    setEditingItem(item);
    setForm(item || { name: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ name: '' });
  };

  // ----------------------------
  // Filter + sort alphabetically
  // ----------------------------
  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  // ----------------------------
  // Pagination
  // ----------------------------
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
  // Render
  // ----------------------------
  return (
    <LoadingIndicator
      loading={loading && items.length === 0}
      text="Fetching items..."
      contentOpacity="opacity-80"      // only opacity, no blur
      overlayOpacity="bg-opacity-40"
    >
      <div className="pt-16 md:pt-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-700">Items</h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <FaPlus /> Add Item
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full p-2 border rounded mb-4"
        />

        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => openModal(item)}
                      className="text-blue-600 hover:underline"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-4 text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">{renderPagination()}</div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Item Name"
                  className="w-full border p-2 rounded"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {editingItem ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LoadingIndicator>
  );
};

export default Items;
