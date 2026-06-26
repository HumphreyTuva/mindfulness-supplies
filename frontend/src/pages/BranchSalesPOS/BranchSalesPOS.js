// src/pages/BranchSalesPOS/BranchSalesPOS.jsx
import React from 'react';
import useBranchSalesPOS from './hooks/useBranchSalesPOS';
import AddItemSelect from './AddItemSelect';
import Cart from './Cart';
import SalesHistory from './SalesHistory';
import ReceiptModal from './ReceiptModal';

const BranchSalesPOS = () => {
  const queryBranchId = new URLSearchParams(window.location.search).get('branch_id');
  const storedBranchId = localStorage.getItem('branch_id');
  const branchId = queryBranchId || storedBranchId || ''; // empty → admin mode

  const {
    cart,
    subtotal,
    total,
    warning,
    lastSalesList,
    loadingSales,
    loadingCartAction,
    receiptOpen,
    receiptData,
    paymentMethod,
    setPaymentMethod,
    setReceiptOpen,
    addToCart,
    changeQty,
    changePrice,       // ✅ include changePrice from the hook
    removeFromCart,
    completeSale,
    loadItemOptions,
  } = useBranchSalesPOS(branchId);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Branch POS — Fast Sales</h1>
        <div className="text-sm text-gray-600">
          Branch: {branchId || 'All (admin)'}
        </div>
      </div>

      {warning && (
        <div className="mb-3 text-red-600 font-medium">{warning}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Items + Cart */}
        <div className="lg:col-span-2 bg-white rounded shadow p-4">
          <AddItemSelect loadItemOptions={loadItemOptions} onAdd={addToCart} />

          {/* Payment Method Selection */}
          <div className="mt-4 mb-4">
            <label className="block text-sm font-medium mb-1">
              Payment Method
            </label>
            <div className="flex gap-6">
              {['Cash', 'PayBill'].map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>

          {/* Cart */}
          <Cart
            cart={cart}
            changeQty={changeQty}
            changePrice={changePrice}   // ✅ pass it to Cart
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            completeSale={completeSale}
            loadingCartAction={loadingCartAction}
          />
        </div>

        {/* Right: Totals & Sales History */}
        <aside className="bg-white rounded shadow p-4">
          <h3 className="font-medium mb-3">Quick totals</h3>

          <div className="mb-3">
            <div className="text-sm text-gray-500">Items in cart</div>
            <div className="font-semibold">{cart.length}</div>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-bold">
              KES {Number(total).toLocaleString()}
            </div>
          </div>

          <div className="border-t pt-3 mt-3">
            <SalesHistory sales={lastSalesList} loading={loadingSales} />
          </div>
        </aside>
      </div>

      {/* Receipt Modal */}
      {receiptOpen && receiptData && (
        <ReceiptModal
          receiptData={receiptData}
          onClose={() => setReceiptOpen(false)}
        />
      )}
    </div>
  );
};

export default BranchSalesPOS;
