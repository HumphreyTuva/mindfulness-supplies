// src/pages/Branches.js
import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';

// LocalStorage key (same structure as Items.js)
const BRANCHES_KEY = 'branches_cache_v1';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true); // show loading ONLY on first backend load
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // ----------------------------
  // Cache helpers
  // ----------------------------
  const readCache = () => {
    try {
      const raw = localStorage.getItem(BRANCHES_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('Branches cache read failed:', err);
      return null;
    }
  };

  const writeCache = (value) => {
    try {
      localStorage.setItem(BRANCHES_KEY, JSON.stringify(value));
    } catch (err) {
      console.warn('Branches cache write failed:', err);
    }
  };

  // ----------------------------
  // Fetch branches from backend
  // ----------------------------
  const fetchBranches = async () => {
    try {
      const res = await api.get('branches/');
      setBranches(res.data);
      writeCache(res.data);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false); // stop loader only after FIRST backend load finishes
    }
  };

  // ----------------------------
  // Load from cache FIRST, then fetch fresh
  // ----------------------------
  useEffect(() => {
    const cached = readCache();

    if (cached) {
      setBranches(cached);
      setLoading(false); // do NOT show loader since we have data
      fetchBranches();   // fetch fresh silently in background
    } else {
      // No cache → show loader
      setLoading(true);
      fetchBranches();
    }
  }, []);

  // ----------------------------
  // Handle save / update
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`branches/${editingBranch.id}/`, formData);
      } else {
        await api.post('branches/', formData);
      }

      fetchBranches();
      setShowModal(false);
      setFormData({ name: '', location: '' });
      setEditingBranch(null);
    } catch (err) {
      handleAuthError(err);
    }
  };

  // ----------------------------
  // Delete branch
  // ----------------------------
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await api.delete(`branches/${id}/`);
        fetchBranches();
      } catch (err) {
        handleAuthError(err);
      }
    }
  };

  // ----------------------------
  // Handle unauthorized
  // ----------------------------
  const handleAuthError = (err) => {
    console.error('Error:', err);
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  // ----------------------------
  // Filter branches
  // ----------------------------
  const filteredBranches = useMemo(() => {
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.location.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, branches]);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <LoadingIndicator
      loading={loading && branches.length === 0}
      text="Fetching branches..."
      contentOpacity="opacity-80"
      overlayOpacity="bg-opacity-40"
    >
      <div className="pt-16 md:pt-0 p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h1 className="text-2xl font-semibold text-gray-700">Branches</h1>
          <button
            onClick={() => {
              setEditingBranch(null);
              setFormData({ name: '', location: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            <FaPlus /> Add Branch
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full p-2 border rounded"
          placeholder="Search by name or location..."
        />

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBranches.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2">{b.location}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBranch(b);
                        setFormData({ name: b.name, location: b.location });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      <FaEdit />
                    </button>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-red-600 hover:underline"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6 w-full max-w-md"
            >
              <h2 className="text-lg font-semibold mb-4">
                {editingBranch ? 'Edit Branch' : 'Add Branch'}
              </h2>

              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Branch Name"
                className="w-full mb-4 border p-2 rounded"
                required
              />

              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Location"
                className="w-full mb-4 border p-2 rounded"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </LoadingIndicator>
  );
};

export default Branches;
