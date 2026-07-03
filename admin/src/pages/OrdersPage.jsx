import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const STATUS_LIST = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const STATUS_STYLE = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-indigo-100 text-indigo-700',
  SHIPPED:    'bg-purple-100 text-purple-700',
  DELIVERED:  'bg-emerald-100 text-emerald-700',
  CANCELLED:  'bg-red-100 text-red-700',
  REFUNDED:   'bg-stone-100 text-stone-600',
};

const STATUS_ICON = {
  PENDING:    'schedule',
  CONFIRMED:  'check_circle',
  PROCESSING: 'settings',
  SHIPPED:    'local_shipping',
  DELIVERED:  'done_all',
  CANCELLED:  'cancel',
  REFUNDED:   'currency_rupee',
};

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({ orderNumber, onClose }) {
  const qc = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState(null);

  const { data: detail, isLoading } = useQuery({
    queryKey: ['admin-order-detail', orderNumber],
    queryFn: () => adminApi.getOrder(orderNumber).then(r => r.data),
    onSuccess: (d) => setPendingStatus(d.status),
  });

  const statusMut = useMutation({
    mutationFn: ({ orderNumber, status }) => adminApi.updateOrderStatus(orderNumber, status),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-order-detail', orderNumber] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const addr = detail?.shipping_address ?? {};
  const currentStatus = pendingStatus ?? detail?.status;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-stone-800 text-lg">Order #{orderNumber}</h2>
            {detail && (
              <p className="text-xs text-stone-400 mt-0.5">
                {new Date(detail.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                {detail.estimated_delivery && ` · Est. delivery: ${new Date(detail.estimated_delivery).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {detail && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[detail.status]}`}>
                <span className="material-symbols-outlined text-xs">{STATUS_ICON[detail.status]}</span>
                {detail.status}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
              <span className="material-symbols-outlined text-stone-500">close</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : detail ? (
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Customer + Shipping */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Customer</p>
                <p className="font-semibold text-stone-800 text-sm">{detail.user_name}</p>
                <p className="text-xs text-stone-500 mt-0.5">{detail.user_email}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Shipping Address</p>
                {addr.full_name ? (
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <p className="font-semibold text-stone-800">{addr.full_name}</p>
                    {addr.phone && <p>{addr.phone}</p>}
                    <p>{addr.address_line1}</p>
                    {addr.address_line2 && <p>{addr.address_line2}</p>}
                    <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                    {addr.country && <p>{addr.country}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400">No address on file</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Order Items</p>
              <div className="flex flex-col gap-2">
                {detail.items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{item.product_name}</p>
                      <p className="text-xs text-stone-400">{item.variant_label} × {item.quantity} @ ₹{item.unit_price}</p>
                    </div>
                    <p className="text-sm font-bold text-stone-800">₹{item.total_price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-stone-50 rounded-xl p-4 flex flex-col gap-1.5 text-sm">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Price Breakdown</p>
              <div className="flex justify-between text-stone-500"><span>Subtotal</span><span>₹{detail.subtotal}</span></div>
              {Number(detail.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{detail.discount_amount}</span></div>
              )}
              <div className="flex justify-between text-stone-500"><span>Shipping</span><span>₹{detail.shipping_charge}</span></div>
              <div className="flex justify-between text-stone-500"><span>Tax (GST)</span><span>₹{detail.tax_amount}</span></div>
              <div className="flex justify-between font-bold text-stone-800 border-t border-stone-200 pt-2 mt-1">
                <span>Total</span><span>₹{detail.total_amount}</span>
              </div>
            </div>

            {/* Notes */}
            {detail.notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Customer Note</p>
                <p className="text-sm text-amber-800">{detail.notes}</p>
              </div>
            )}

            {/* Update Status */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-semibold text-stone-700 whitespace-nowrap">Update Status:</span>
              <select
                value={currentStatus ?? detail.status}
                onChange={e => setPendingStatus(e.target.value)}
                className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30"
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                onClick={() => statusMut.mutate({ orderNumber: detail.order_number, status: currentStatus })}
                disabled={statusMut.isPending || currentStatus === detail.status}
                className="px-4 py-2 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#d43d0f] disabled:opacity-50 cursor-pointer border-0 whitespace-nowrap"
              >
                {statusMut.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filters, page],
    queryFn: () =>
      adminApi.getOrders({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')), page }).then(r => r.data),
  });

  const inlineStatusMut = useMutation({
    mutationFn: ({ orderNumber, status }) => adminApi.updateOrderStatus(orderNumber, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const set = (key) => (e) => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Orders" />
      <div className="p-6 flex flex-col gap-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input
              placeholder="Order # or customer email..."
              value={filters.search}
              onChange={set('search')}
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-64"
            />
          </div>
          <select
            value={filters.status}
            onChange={set('status')}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filters.search || filters.status) && (
            <button
              onClick={() => { setFilters({ status: '', search: '' }); setPage(1); }}
              className="px-3 py-2.5 text-sm text-stone-500 hover:text-stone-700 border border-stone-200 rounded-xl bg-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100 sticky top-0 z-10">
                  <tr>
                    {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-stone-400">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
                        No orders found
                      </td>
                    </tr>
                  )}
                  {data?.results?.map(o => (
                    <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-stone-800">{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-stone-800">{o.user_name}</p>
                        <p className="text-xs text-stone-400">{o.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{o.item_count} item{o.item_count !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-sm font-bold text-stone-800">₹{o.total_amount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[o.status]}`}>
                          <span className="material-symbols-outlined text-xs">{STATUS_ICON[o.status]}</span>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(o.order_number)}
                            className="px-3 py-1.5 bg-[#ec4913]/10 text-[#ec4913] text-xs font-semibold rounded-lg hover:bg-[#ec4913] hover:text-white transition-colors cursor-pointer border-0 whitespace-nowrap"
                          >
                            View
                          </button>
                          <select
                            value={o.status}
                            onChange={e => inlineStatusMut.mutate({ orderNumber: o.order_number, status: e.target.value })}
                            className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white"
                          >
                            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.total_pages} count={data?.count} onPageChange={setPage} />
          </div>
        )}
      </div>

      {selected && (
        <OrderDetailModal orderNumber={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
