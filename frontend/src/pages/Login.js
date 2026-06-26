import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiLoader } from 'react-icons/fi';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('auth/login/', formData);
      const { access, is_admin, branch_id, can_stock } = res.data;

      // Save in local storage
      localStorage.setItem('token', access);
      localStorage.setItem('role', is_admin ? 'admin' : 'branch');
      localStorage.setItem('branch_id', branch_id || '');
      localStorage.setItem('can_stock', can_stock ? 'true' : 'false');

      // Redirect logic
      if (is_admin) {
        navigate('/dashboard');
      } else if (branch_id) {
        navigate(`/branch-pos?branch_id=${branch_id}`);
      } else {
        setError('Unauthorized access');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center"
      >
        <img
          src="/images/logo.png"
          alt="Mindfullness Supplies Logo"
          className="h-20 w-auto mx-auto mb-4"
        />

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

        {error && (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        )}

        <div className="mb-4 text-left">
          <label htmlFor="username" className="block text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter username"
            required
          />
        </div>

        <div className="mb-6 relative text-left">
          <label htmlFor="password" className="block text-gray-700 mb-1">
            Password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300 pr-10"
            placeholder="Enter password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute top-9 right-3 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading && <FiLoader className="animate-spin text-white text-lg" />}
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
