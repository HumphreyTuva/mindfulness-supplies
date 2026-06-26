// src/pages/BranchSalesPOS/utils/inventoryApi.js
import api from '../../../api/axios';

export const fetchInventory = async (branchId) => {
  const url = branchId ? `inventory/?branch_id=${branchId}` : 'inventory/';
  const res = await api.get(url);
  return res.data.map((inv) => ({
    inventoryId: inv.id,
    itemId: inv.item.id,
    name: inv.item.name,
    price: parseFloat(inv.item.price),
    quantity: inv.quantity,
  }));
};

export const searchInventory = async (branchId, query) => {
  const url = branchId
    ? `inventory/?branch_id=${branchId}&search=${encodeURIComponent(query)}`
    : `inventory/?search=${encodeURIComponent(query)}`;
  const res = await api.get(url);
  return res.data;
};
