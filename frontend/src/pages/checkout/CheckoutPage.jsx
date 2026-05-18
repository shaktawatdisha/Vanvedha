import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/cartStore';
import { ordersApi } from '../../api/orders';
import { authApi } from '../../api/auth';

const GST_RATE = 0.18;
const FREE_SHIPPING_THRESHOLD = 499;
const SHIPPING_CHARGE = 60;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const EMPTY_FORM = {
  label: 'HOME', full_name: '', phone: '', address_line1: '', address_line2: '',
  city: '', state: '', pincode: '', country: 'India',
};

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]/70">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'rounded-xl border border-[#c9a84c]/20 bg-[#1a3d2a] text-[#f5ead0] px-4 py-2.5 text-sm outline-none focus:border-[#c9a84c] placeholder:text-[#c9a84c]/30 w-full';

function SavedAddressCard({ addr, selected, onSelect, onSetDefault, onDelete }) {
  const [working, setWorking] = useState(false);

  const handleSetDefault = async (e) => {
    e.stopPropagation();
    setWorking(true);
    try { await onSetDefault(addr.id); } finally { setWorking(false); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setWorking(true);
    try { await onDelete(addr.id); } finally { setWorking(false); }
  };

  return (
    <div
      onClick={() => onSelect(addr)}
      className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
        selected ? 'border-[#c9a84c] bg-[#c9a84c]/5' : 'border-[#c9a84c]/15 hover:border-[#c9a84c]/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
            selected ? 'border-[#c9a84c]' : 'border-[#c9a84c]/30'
          }`}>
            {selected && <div className="w-2 h-2 rounded-full bg-[#c9a84c]" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#c9a84c]">{addr.label}</span>
          {addr.is_default && <span className="text-xs text-green-400 font-medium">Default</span>}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {!addr.is_default && (
            <button
              type="button"
              disabled={working}
              onClick={handleSetDefault}
              className="text-xs text-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-40"
            >
              Set default
            </button>
          )}
          <button
            type="button"
            disabled={working}
            onClick={handleDelete}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="ml-6 text-sm text-[#d4c5a0] leading-relaxed">
        <p className="font-semibold text-[#f5ead0]">{addr.full_name}</p>
        <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
        <p>{addr.city}, {addr.state} – {addr.pincode}</p>
        <p className="text-[#c9a84c]/60 text-xs mt-0.5">{addr.phone}</p>
      </div>
    </div>
  );
}

function OrderItemRow({ item }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#c9a84c]/10 last:border-0">
      <div className="size-12 rounded-lg overflow-hidden bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-[#c9a84c] text-base">herbs</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#f5ead0] leading-tight truncate">{item.product_name}</p>
        <p className="text-xs text-[#c9a84c]/60">{item.variant_label} × {item.quantity}</p>
      </div>
      <p className="text-sm font-bold text-[#f5ead0] flex-shrink-0">₹{item.line_total.toFixed(2)}</p>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, subtotal, coupon_code, clearLocal } = useCartStore();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSaved, setSelectedSaved]   = useState(null);
  const [useNew, setUseNew]                 = useState(false);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saveAddress, setSaveAddress]       = useState(false);
  const [notes, setNotes]                   = useState('');
  const [placing, setPlacing]               = useState(false);

  const loadAddresses = () => {
    authApi.getAddresses()
      .then((res) => {
        const list = res.data?.results ?? res.data ?? [];
        setSavedAddresses(list);
        const def = list.find((a) => a.is_default) || list[0] || null;
        if (def) { setSelectedSaved((prev) => list.find((a) => a.id === prev?.id) || def); setUseNew(false); }
        else { setSelectedSaved(null); setUseNew(true); }
      })
      .catch(() => setUseNew(true));
  };

  useEffect(() => { loadAddresses(); }, []);

  const handleSetDefault = async (id) => {
    try {
      await authApi.setDefaultAddress(id);
      toast.success('Default address updated');
      loadAddresses();
    } catch {
      toast.error('Failed to update default address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await authApi.deleteAddress(id);
      toast.success('Address removed');
      loadAddresses();
    } catch {
      toast.error('Failed to remove address');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <span className="material-symbols-outlined text-[#c9a84c] text-5xl mb-4 block">shopping_bag</span>
        <h2 className="text-2xl font-black text-[#f5ead0] mb-4">Your cart is empty</h2>
        <Link to="/products" className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0f2419] font-bold px-6 py-3 rounded-xl hover:bg-[#e8c96a] transition-colors no-underline">
          Shop Spices
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const tax      = Math.round(subtotal * GST_RATE * 100) / 100;
  const grandTotal = subtotal + shipping + tax;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const getShippingAddress = () => {
    if (!useNew && selectedSaved) {
      const { id, label, is_default, created_at, updated_at, user, ...addr } = selectedSaved;
      return addr;
    }
    const { label, ...addr } = form;
    return addr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const addr = getShippingAddress();
    const required = ['full_name','phone','address_line1','city','state','pincode'];
    if (required.some((k) => !addr[k]?.trim())) {
      toast.error('Please fill in all required address fields');
      return;
    }
    setPlacing(true);
    try {
      if (useNew && saveAddress) {
        await authApi.createAddress({ ...addr, label: form.label }).catch(() => {});
      }
      const res = await ordersApi.createOrder({
        shipping_address: addr,
        notes,
        ...(coupon_code ? { coupon_code } : {}),
      });
      clearLocal();
      navigate(`/orders/${res.data.order_number}/confirmation`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#c9a84c]/60 mb-8">
        <Link to="/cart" className="hover:text-[#c9a84c] no-underline transition-colors">Cart</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-[#f5ead0] font-semibold">Checkout</span>
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-5 gap-10 items-start">

          {/* ── Left: Address + Notes ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Saved addresses */}
            {savedAddresses.length > 0 && (
              <section className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6">
                <h2 className="text-lg font-black text-[#f5ead0] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c9a84c]">location_on</span>
                  Saved Addresses
                </h2>
                <div className="flex flex-col gap-3">
                  {savedAddresses.map((addr) => (
                    <SavedAddressCard
                      key={addr.id}
                      addr={addr}
                      selected={!useNew && selectedSaved?.id === addr.id}
                      onSelect={(a) => { setSelectedSaved(a); setUseNew(false); }}
                      onSetDefault={handleSetDefault}
                      onDelete={handleDeleteAddress}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => { setUseNew(true); setSelectedSaved(null); }}
                    className={`flex items-center gap-2 rounded-xl p-4 border-2 text-sm font-bold transition-all cursor-pointer bg-transparent text-left ${
                      useNew ? 'border-[#c9a84c] text-[#c9a84c]' : 'border-[#c9a84c]/15 text-[#c9a84c]/50 hover:border-[#c9a84c]/40 hover:text-[#c9a84c]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_location</span>
                    Use a different address
                  </button>
                </div>
              </section>
            )}

            {/* New address form */}
            {(useNew || savedAddresses.length === 0) && (
              <section className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6">
                <h2 className="text-lg font-black text-[#f5ead0] mb-5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#c9a84c]">location_on</span>
                  Delivery Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Address Type" required>
                    <select className={inputCls} name="label" value={form.label} onChange={handleChange}>
                      <option value="HOME">Home</option>
                      <option value="WORK">Work</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </Field>
                  <div className="hidden sm:block" />
                  <Field label="Full Name" required>
                    <input className={inputCls} name="full_name" value={form.full_name} onChange={handleChange} placeholder="John Doe" />
                  </Field>
                  <Field label="Phone" required>
                    <input className={inputCls} name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" type="tel" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" required>
                      <input className={inputCls} name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="House/Flat no., Street, Area" />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address Line 2">
                      <input className={inputCls} name="address_line2" value={form.address_line2} onChange={handleChange} placeholder="Landmark (optional)" />
                    </Field>
                  </div>
                  <Field label="City" required>
                    <input className={inputCls} name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" />
                  </Field>
                  <Field label="State" required>
                    <select className={inputCls} name="state" value={form.state} onChange={handleChange}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Pincode" required>
                    <input className={inputCls} name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" maxLength={6} />
                  </Field>
                  <Field label="Country" required>
                    <input className={inputCls} name="country" value={form.country} onChange={handleChange} placeholder="India" />
                  </Field>
                </div>
                <label className="flex items-center gap-2.5 mt-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#c9a84c] cursor-pointer"
                  />
                  <span className="text-sm text-[#d4c5a0]">Save this address to my profile</span>
                </label>
              </section>
            )}

            {/* Notes */}
            <section className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6">
              <h2 className="text-base font-black text-[#f5ead0] mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#c9a84c]">note</span>
                Order Notes
                <span className="text-sm font-normal text-[#c9a84c]/50">(optional)</span>
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or delivery notes…"
                className="w-full rounded-xl border border-[#c9a84c]/20 bg-[#1a3d2a] text-[#f5ead0] px-4 py-2.5 text-sm outline-none focus:border-[#c9a84c] resize-none placeholder:text-[#c9a84c]/30"
              />
            </section>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="lg:col-span-2 sticky top-24 flex flex-col gap-4">
            <div className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6">
              <h2 className="text-lg font-black text-[#f5ead0] mb-1">Order Summary</h2>
              <p className="text-xs text-[#c9a84c]/50 mb-4">{items.length} {items.length === 1 ? 'item' : 'items'}</p>

              <div className="mb-5">
                {items.map((item) => <OrderItemRow key={item.variant_id} item={item} />)}
              </div>

              <div className="space-y-2.5 text-sm border-t border-[#c9a84c]/10 pt-4">
                <div className="flex justify-between text-[#d4c5a0]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#f5ead0]">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#d4c5a0]">
                  <span>Shipping</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-green-400' : 'text-[#f5ead0]'}`}>
                    {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[#c9a84c]/40">
                    Add ₹{(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-[#d4c5a0]">
                  <span>GST (18%)</span>
                  <span className="font-semibold text-[#f5ead0]">₹{tax.toFixed(2)}</span>
                </div>
                {coupon_code && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">local_offer</span>
                      {coupon_code}
                    </span>
                    <span className="font-semibold">Applied</span>
                  </div>
                )}
                <div className="border-t border-[#c9a84c]/15 pt-3 flex justify-between items-baseline">
                  <span className="font-black text-[#f5ead0]">Total</span>
                  <span className="font-black text-[#c9a84c] text-xl">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Place Order button */}
            <button
              type="submit"
              disabled={placing}
              className="w-full bg-[#c9a84c] hover:bg-[#e8c96a] text-[#0f2419] font-black py-4 rounded-xl shadow-lg shadow-[#c9a84c]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer border-0 text-base"
            >
              {placing ? (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  Placing Order…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Place Order
                </>
              )}
            </button>

            <div className="flex flex-col gap-2 px-1">
              {[
                { icon: 'verified_user', label: 'Secure & encrypted checkout' },
                { icon: 'replay',        label: '7-day easy returns' },
                { icon: 'support_agent', label: '24/7 customer support' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-[#c9a84c]/50">
                  <span className="material-symbols-outlined text-[14px] text-[#c9a84c]/70">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
