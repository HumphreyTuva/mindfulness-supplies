// src/pages/BranchSalesPOS/AddItemSelect.jsx
import React from 'react';
import AsyncSelect from 'react-select/async';

export default function AddItemSelect({ loadItemOptions, onAdd }) {
  return (
    <AsyncSelect
      cacheOptions
      loadOptions={loadItemOptions}
      onChange={(selected) => onAdd(selected)}
      placeholder="Type to search item (name, barcode, etc.)"
      noOptionsMessage={() => 'No items found'}
      styles={{
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
      }}
    />
  );
}
