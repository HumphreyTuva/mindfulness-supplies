import React from 'react';
import { FaTrash } from 'react-icons/fa';

export default function Cart({
  cart,
  changeQty,
  changePrice,   // <-- new handler for editable price
  removeFromCart,
  subtotal,
  completeSale,
  loadingCartAction,
}) {
  return (
    <div>
      <h2 className="font-medium mb-3">Add items</h2>

      <div className="mt-4">
        <h3 className="font-medium mb-2">Cart</h3>
        <div className="space-y-2">
          {cart.length === 0 && (
            <div className="text-gray-500">Cart is empty — add items above</div>
          )}

          {cart.map((c) => (
            <div
              key={c.itemId}
              className="flex items-center justify-between p-2 border rounded"
            >
              {/* Item details */}
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>

                {/* Editable price input */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>KES</span>
                  <input
                    type="number"
                    min="1"
                    value={c.price}
                    onChange={(e) =>
                      changePrice(c.itemId, Number(e.target.value))
                    }
                    className="w-24 p-1 border rounded text-right"
                  />
                </div>
              </div>

              {/* Quantity + total + remove */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={c.maxQty}
                  value={c.qty}
                  onChange={(e) =>
                    changeQty(c.itemId, Number(e.target.value))
                  }
                  className="w-20 p-1 border rounded text-center"
                  aria-label={`Quantity for ${c.name}`}
                />

                <div className="w-28 text-right font-medium">
                  KES {(c.price * c.qty).toLocaleString()}
                </div>

                <button
                  onClick={() => removeFromCart(c.itemId)}
                  className="ml-2 text-red-600"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtotal + Checkout */}
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Subtotal</div>
          <div className="font-bold">KES {Number(subtotal).toLocaleString()}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={completeSale}
            disabled={loadingCartAction || cart.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loadingCartAction ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
