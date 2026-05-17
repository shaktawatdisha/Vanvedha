import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ordersApi } from '../../api/orders';
import { catalogApi } from '../../api/catalog';

const NAV_LINKS = [
  { icon: 'dashboard',   label: 'Overview',         tab: 'overview'         },
  { icon: 'history',     label: 'Order History',    tab: 'order-history'    },
  { icon: 'location_on', label: 'Addresses',        tab: 'addresses'        },
  { icon: 'settings',    label: 'Account Settings', tab: 'account-settings' },
];

const STATUS_COLORS = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
  REFUNDED:   'bg-slate-100 text-slate-600',
};

function UserAvatar({ firstName, lastName, size = 'md' }) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-lg';
  return (
    <div className={`${sizeClass} shrink-0 flex items-center justify-center rounded-full bg-[#ec4913] text-white font-black border-2 border-[#ec4913] ring-2 ring-[#ec4913]/20`}>
      {initials}
    </div>
  );
}

/* ─── Overview Tab ─── */
function OverviewTab({ user, orders, featuredProducts }) {
  const recentOrder = orders[0] || null;

  return (
    <div className="flex flex-col gap-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#ec4913]/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{orders.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#ec4913]/5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivered</p>
          <p className="mt-1 text-3xl font-black text-slate-900">
            {orders.filter((o) => o.status === 'DELIVERED').length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-[#ec4913]/5 col-span-2 sm:col-span-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
          <p className="mt-1 text-lg font-black text-slate-900">
            {user?.date_joined
              ? new Date(user.date_joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
              : '—'}
          </p>
        </div>
      </div>

      {/* Recent Order */}
      <div className="rounded-3xl bg-white p-6 shadow-xl shadow-[#ec4913]/5">
        <h3 className="text-lg font-bold mb-4">Recent Order</h3>
        {recentOrder ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                #{recentOrder.order_number}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[recentOrder.status] || 'bg-slate-100 text-slate-600'}`}>
                {recentOrder.status.charAt(0) + recentOrder.status.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {recentOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-semibold">{item.product_name}</p>
                    <p className="text-slate-400 text-xs">{item.variant_label} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-slate-700">₹{item.total_price}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                {new Date(recentOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="font-black text-[#ec4913]">₹{recentOrder.total_amount}</span>
            </div>
            {recentOrder.shipment?.tracking_number && (
              <p className="text-xs text-slate-400">
                Tracking: <span className="font-semibold text-slate-600">{recentOrder.shipment.tracking_number}</span>
                {recentOrder.shipment.tracking_url && (
                  <a href={recentOrder.shipment.tracking_url} target="_blank" rel="noreferrer" className="ml-2 text-[#ec4913] hover:underline">Track →</a>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
            <span className="material-symbols-outlined text-4xl">shopping_bag</span>
            <p className="text-sm">No orders yet</p>
          </div>
        )}
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold">Featured Spices</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.slice(0, 3).map((p) => (
              <div key={p.id} className="group overflow-hidden rounded-2xl bg-white border border-[#ec4913]/5 p-4 hover:shadow-lg transition-all">
                <div className="h-36 w-full overflow-hidden rounded-xl bg-[#ec4913]/5">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-[#ec4913]/30">herbs</span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.short_description || p.category_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-black text-[#ec4913] text-sm">₹{p.price}</span>
                    <button className="rounded-lg bg-[#ec4913]/10 p-1.5 text-[#ec4913] hover:bg-[#ec4913] hover:text-white transition-colors border-0 cursor-pointer">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Order History Tab ─── */
function OrderHistoryTab({ orders, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Loading orders…
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
        <span className="material-symbols-outlined text-5xl">shopping_bag</span>
        <p className="font-semibold">No orders yet</p>
        <p className="text-sm">Your orders will appear here once you place one.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl bg-white p-5 border border-[#ec4913]/5 shadow-sm">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-sm text-slate-500 uppercase tracking-wide">#{order.order_number}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-semibold">{item.product_name}</p>
                  <p className="text-slate-400 text-xs">{item.variant_label} × {item.quantity}</p>
                </div>
                <p className="font-bold text-slate-700">₹{item.total_price}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-4 text-xs text-slate-500">
              {order.estimated_delivery && (
                <span>Est. delivery: <span className="font-semibold text-slate-700">{new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></span>
              )}
              {order.shipment?.tracking_number && (
                <span>
                  Tracking: <span className="font-semibold text-slate-700">{order.shipment.tracking_number}</span>
                  {order.shipment.tracking_url && (
                    <a href={order.shipment.tracking_url} target="_blank" rel="noreferrer" className="ml-1 text-[#ec4913] hover:underline">→</a>
                  )}
                </span>
              )}
            </div>
            <span className="font-black text-[#ec4913]">₹{order.total_amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Addresses Tab ─── */
function AddressesTab({ addresses, loading, onRefresh }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await authApi.deleteAddress(id);
      toast.success('Address removed');
      onRefresh();
    } catch {
      toast.error('Failed to remove address');
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await authApi.setDefaultAddress(id);
      toast.success('Default address updated');
      onRefresh();
    } catch {
      toast.error('Failed to update default address');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
        Loading addresses…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!addresses.length && (
        <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
          <span className="material-symbols-outlined text-5xl">location_off</span>
          <p className="font-semibold">No saved addresses</p>
        </div>
      )}
      {addresses.map((addr) => (
        <div key={addr.id} className={`rounded-2xl bg-white p-5 border shadow-sm ${addr.is_default ? 'border-[#ec4913]/40' : 'border-[#ec4913]/5'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-[#ec4913]/10 text-[#ec4913]">{addr.label}</span>
              {addr.is_default && <span className="text-xs font-bold text-green-600">Default</span>}
            </div>
            <div className="flex gap-2">
              {!addr.is_default && (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-xs text-slate-400 hover:text-[#ec4913] cursor-pointer border-0 bg-transparent"
                >
                  Set default
                </button>
              )}
              <button
                onClick={() => handleDelete(addr.id)}
                disabled={deleting === addr.id}
                className="text-xs text-slate-400 hover:text-red-500 cursor-pointer border-0 bg-transparent disabled:opacity-50"
              >
                {deleting === addr.id ? '…' : 'Remove'}
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-700 leading-relaxed">
            <p className="font-semibold">{addr.full_name}</p>
            <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
            <p>{addr.city}, {addr.state} – {addr.pincode}</p>
            <p>{addr.country}</p>
            <p className="text-slate-400 mt-1">{addr.phone}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Account Settings Tab ─── */
function AccountSettingsTab({ user }) {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authApi.updateProfile(form);
      setUser(res.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="rounded-2xl bg-white p-6 border border-[#ec4913]/5 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Personal Information</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913] focus:ring-1 focus:ring-[#ec4913]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913] focus:ring-1 focus:ring-[#ec4913]"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913] focus:ring-1 focus:ring-[#ec4913]"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className={`h-2 w-2 rounded-full ${user?.is_verified ? 'bg-green-500' : 'bg-yellow-400'}`} />
            {user?.is_verified ? 'Email verified' : 'Email not verified'}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#ec4913] py-3 text-sm font-bold text-white hover:bg-[#ec4913]/90 transition-colors disabled:opacity-60 cursor-pointer border-0"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Root Component ─── */
export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses]         = useState([]);
  const [addrLoading, setAddrLoading]     = useState(true);
  const [featured, setFeatured]           = useState([]);

  useEffect(() => {
    ordersApi.getOrders()
      .then((res) => setOrders(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));

    catalogApi.getFeatured()
      .then((res) => setFeatured(res.data?.results ?? res.data ?? []))
      .catch(() => {});
  }, []);

  const loadAddresses = () => {
    setAddrLoading(true);
    authApi.getAddresses()
      .then((res) => setAddresses(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setAddrLoading(false));
  };

  useEffect(() => { loadAddresses(); }, []);

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { await authApi.logout(refresh); } catch { /* ignore */ }
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'User';
  const fullName  = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || firstName;

  return (
    <div className="bg-[#f8f6f6] font-display text-slate-900 min-h-screen">
      <main className="flex flex-1 flex-col px-4 py-8 md:flex-row md:px-10 lg:px-40 gap-8 max-w-[1440px] mx-auto">

        {/* ── Sidebar ── */}
        <aside className="w-full shrink-0 md:w-64 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <UserAvatar firstName={user?.first_name} lastName={user?.last_name} />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">{fullName}</h1>
              <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
              <p className="text-xs font-medium text-[#ec4913]/70 uppercase tracking-widest mt-0.5">
                {user?.role === 'ADMIN' ? 'Admin' : 'Member'}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ icon, label, tab }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all cursor-pointer border-0 w-full
                  ${activeTab === tab
                    ? 'bg-[#ec4913] text-white'
                    : 'text-slate-600 hover:bg-[#ec4913]/5 hover:text-[#ec4913] bg-transparent'}`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
            <div className="my-2 border-t border-[#ec4913]/10" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 hover:text-red-500 transition-all cursor-pointer border-0 bg-transparent w-full text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <section className="flex flex-1 flex-col gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              {activeTab === 'overview' ? `Welcome back, ${firstName}` : NAV_LINKS.find((n) => n.tab === activeTab)?.label}
            </h2>
          </div>

          {activeTab === 'overview' && (
            <OverviewTab user={user} orders={orders} featuredProducts={featured} />
          )}
          {activeTab === 'order-history' && (
            <OrderHistoryTab orders={orders} loading={ordersLoading} />
          )}
          {activeTab === 'addresses' && (
            <AddressesTab addresses={addresses} loading={addrLoading} onRefresh={loadAddresses} />
          )}
          {activeTab === 'account-settings' && (
            <AccountSettingsTab user={user} />
          )}
        </section>
      </main>

      <footer className="border-t border-[#ec4913]/10 bg-white py-10 text-center mt-8">
        <p className="text-sm font-medium text-slate-400">© 2024 Vanvedha. Artisan Flavors for Modern Kitchens.</p>
      </footer>
    </div>
  );
}
