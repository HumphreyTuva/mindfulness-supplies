// src/pages/BranchSalesPOS/utils/salesApi.js
import api from '../../../api/axios';

export const fetchSales = async (branchId) => {
  const url = branchId ? `sales/?branch_id=${branchId}` : 'sales/';
  const res = await api.get(url);
  return res.data;
};

export const postSales = (payloads) => {
  // returns a Promise that resolves to an array of axios responses
  return Promise.all(payloads.map((p) => api.post('sales/', p)));
};
