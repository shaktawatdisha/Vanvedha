import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/cartStore';

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="size-24 rounded-full bg-[#ec4913]/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[#ec4913] text-5xl">shopping_bag</span>
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h2>
      <p className="text-slate-500 mb-8">Add some spices to get started!</p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 bg-[#ec4913] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#ec4913]/90 transition-colors no-underline"
      >
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        Shop Spices
      </Link>
    </div>
  );
}

function CartItemRow({ item, onUpdate, onRemove }) {
  const [qty, setQty] = useState(item.quantity);
  const [saving, setSaving] = useState(false);

  const handleQtyChange = async (newQty) => {
    if (newQty < 1 || newQty === qty) return;
    setSaving(true);
    try {
      await onUpdate(item.variant_id, newQty);
      setQty(newQty);
    } catch {
      toast.error('Failed to update quantity');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await onRemove(item.variant_id);
    } catch {
      toast.error('Failed to remove item');
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-4 py-5 border-b border-slate-100 last:border-0">
      <div className="size-16 rounded-xl overflow-hidden bg-[#ec4913]/10 flex items-center justify-center flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[#ec4913] text-2xl">herbs</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-900 text-base leading-tight">{item.product_name}</p>
        <p className="text-sm text-slate-500 mt-0.5">{item.variant_label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#ec4913] font-bold text-sm">₹{item.price}</span>
          {Number(item.mrp) > Number(item.price) && (
            <span className="text-slate-400 text-xs line-through">₹{item.mrp}</span>
          )}
        </div>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-1 py-1">
        <button
          onClick={() => handleQtyChange(qty - 1)}
          disabled={saving || qty <= 1}
          className="size-7 flex items-center justify-center rounded-md hover:bg-white hover:text-[#ec4913] transition-colors disabled:opacity-40 cursor-pointer border-0 bg-transparent"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <span className="w-6 text-center text-sm font-bold">{qty}</span>
        <button
          onClick={() => handleQtyChange(qty + 1)}
          disabled={saving || qty >= item.stock}
          className="size-7 flex items-center justify-center rounded-md hover:bg-white hover:text-[#ec4913] transition-colors disabled:opacity-40 cursor-pointer border-0 bg-transparent"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>

      {/* Line total */}
      <p className="w-20 text-right font-bold text-slate-900">₹{item.line_total.toFixed(2)}</p>

      {/* Remove */}
      <button
        onClick={handleRemove}
        disabled={saving}
        className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer border-0 bg-transparent"
        title="Remove item"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}

function CouponSection({ couponCode, onApply, onRemove }) {
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setWorking(true);
    try {
      await onApply(input.trim().toUpperCase());
      toast.success('Coupon applied!');
      setInput('');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setWorking(false);
    }
  };

  const handleRemove = async () => {
    setWorking(true);
    try {
      await onRemove();
      toast.success('Coupon removed');
    } catch {
      toast.error('Failed to remove coupon');
    } finally {
      setWorking(false);
    }
  };

  if (couponCode) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-green-700">
          <span className="material-symbols-outlined text-[20px]">local_offer</span>
          <span className="font-bold text-sm">{couponCode} applied</span>
        </div>
        <button
          onClick={handleRemove}
          disabled={working}
          className="text-sm text-red-500 hover:text-red-700 font-semibold disabled:opacity-50 cursor-pointer border-0 bg-transparent"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Coupon code"
        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913] uppercase"
      />
      <button
        type="submit"
        disabled={working || !input.trim()}
        className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer border-0"
      >
        {working ? 'Applying…' : 'Apply'}
      </button>
    </form>
  );
}

export default function CartPage() {
  const {
    items, subtotal, shipping_charge, total, coupon_code, loading,
    fetchCart, updateItem, removeItem, applyCoupon, removeCoupon,
  } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading && items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-32 mb-10" />
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
        <EmptyCart />
      </div>
    );
  }

  const FREE_SHIPPING_THRESHOLD = 500;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black text-slate-900">Shopping Cart</h1>
        <span className="text-slate-500 text-sm font-medium">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-10 items-start">

        {/* ── Items list ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6">
            {items.map((item) => (
              <CartItemRow
                key={item.variant_id}
                item={item}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>

          {/* Coupon */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ec4913] text-[20px]">local_offer</span>
              Coupon Code
            </h3>
            <CouponSection
              couponCode={coupon_code}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />
          </div>

          {/* Continue shopping */}
          <Link
            to="/products"
            className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-slate-500 hover:text-[#ec4913] transition-colors no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Continue Shopping
          </Link>
        </div>

        {/* ── Order summary ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
          <h2 className="text-lg font-black text-slate-900 mb-6">Order Summary</h2>

          <div className="space-y-3 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Shipping</span>
              {shipping_charge === 0 ? (
                <span className="font-semibold text-green-600">Free</span>
              ) : (
                <span className="font-semibold">₹{shipping_charge.toFixed(2)}</span>
              )}
            </div>

            {shipping_charge > 0 && (
              <p className="text-xs text-slate-400">
                Add ₹{(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
              </p>
            )}

            {coupon_code && (
              <div className="flex justify-between text-green-600">
                <span className="font-medium">Coupon ({coupon_code})</span>
                <span className="font-semibold">Applied</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-between text-base">
              <span className="font-black text-slate-900">Total</span>
              <span className="font-black text-[#ec4913] text-lg">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-[#ec4913] hover:bg-[#ec4913]/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#ec4913]/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
            Proceed to Checkout
          </button>

          <div className="mt-6 flex flex-col gap-2">
            {[
              { icon: 'verified_user', label: 'Secure checkout' },
              { icon: 'local_shipping', label: 'Free shipping over ₹500' },
              { icon: 'replay', label: 'Easy returns' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="material-symbols-outlined text-[16px] text-[#ec4913]">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
