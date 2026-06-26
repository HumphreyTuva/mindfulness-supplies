// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://mindfulnesssupplies.pythonanywhere.com/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
