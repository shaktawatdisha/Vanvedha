import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';

const STATUS_INFO = {
  PENDING:    { icon: 'schedule',       color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
  CONFIRMED:  { icon: 'check_circle',   color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Confirmed' },
  PROCESSING: { icon: 'autorenew',      color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Processing' },
  SHIPPED:    { icon: 'local_shipping', color: 'text-indigo-400', bg: 'bg-indigo-400/10', label: 'Shipped' },
  DELIVERED:  { icon: 'done_all',       color: 'text-green-400',  bg: 'bg-green-400/10',  label: 'Delivered' },
  CANCELLED:  { icon: 'cancel',         color: 'text-red-400',    bg: 'bg-red-400/10',    label: 'Cancelled' },
  REFUNDED:   { icon: 'currency_rupee', color: 'text-slate-400',  bg: 'bg-slate-400/10',  label: 'Refunded' },
};

function SummaryRow({ label, value, highlight, strikethrough }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#d4c5a0]">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-[#c9a84c]' : strikethrough ? 'text-green-400' : 'text-[#f5ead0]'}`}>
        {value}
      </span>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrder(orderNumber)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-[#c9a84c] text-5xl" style={{ animation: 'spin 1s linear infinite' }}>progress_activity</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <span className="material-symbols-outlined text-[#c9a84c]/40 text-6xl block mb-4">search_off</span>
        <p className="text-[#d4c5a0] text-lg mb-6">Order not found.</p>
        <Link to="/products" className="inline-flex items-center gap-2 bg-[#c9a84c] text-[#0f2419] font-bold px-6 py-3 rounded-xl hover:bg-[#e8c96a] transition-colors no-underline">
          Back to Shop
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.CONFIRMED;
  const addr = order.shipping_address || {};
  const discount = Number(order.discount_amount);
  const shipping = Number(order.shipping_charge);
  const tax      = Number(order.tax_amount);

  return (
    <div className="max-w-2xl mx-auto px-6 lg:px-10 py-12">

      {/* Success header */}
      <div className="text-center mb-10">
        <div className="size-20 mx-auto rounded-full bg-[#c9a84c]/15 border-2 border-[#c9a84c]/40 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[#c9a84c] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </div>
        <h1 className="text-3xl font-black text-[#f5ead0] mb-2">Order Placed!</h1>
        <p className="text-[#d4c5a0]">Thank you! We'll confirm your order shortly.</p>
      </div>

      {/* Order card */}
      <div className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6 mb-4">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-xs text-[#c9a84c]/60 uppercase tracking-widest font-bold mb-0.5">Order Number</p>
            <p className="text-2xl font-black text-[#f5ead0]">#{order.order_number}</p>
            <p className="text-xs text-[#c9a84c]/50 mt-1">
              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${statusInfo.bg} ${statusInfo.color}`}>
            <span className="material-symbols-outlined text-[16px]">{statusInfo.icon}</span>
            {statusInfo.label}
          </div>
        </div>

        {/* Items */}
        <div className="border-t border-[#c9a84c]/10 py-4 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-[#c9a84c]/5 last:border-0 text-sm">
              <div>
                <p className="font-semibold text-[#f5ead0]">{item.product_name}</p>
                <p className="text-xs text-[#c9a84c]/60 mt-0.5">{item.variant_label} × {item.quantity}</p>
              </div>
              <p className="font-bold text-[#f5ead0] ml-4">₹{Number(item.total_price).toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Price breakdown */}
        <div className="space-y-2.5 border-t border-[#c9a84c]/10 pt-4">
          <SummaryRow label="Subtotal" value={`₹${Number(order.subtotal).toFixed(2)}`} />
          {discount > 0 && <SummaryRow label="Discount" value={`−₹${discount.toFixed(2)}`} strikethrough />}
          <SummaryRow
            label="Shipping"
            value={shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
            strikethrough={shipping === 0}
          />
          {tax > 0 && <SummaryRow label="GST (18%)" value={`₹${tax.toFixed(2)}`} />}
          <div className="flex justify-between items-baseline pt-3 border-t border-[#c9a84c]/15">
            <span className="font-black text-[#f5ead0] text-base">Total Paid</span>
            <span className="font-black text-[#c9a84c] text-xl">₹{Number(order.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {addr.address_line1 && (
        <div className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6 mb-4">
          <h3 className="font-bold text-[#f5ead0] mb-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[#c9a84c] text-[18px]">local_shipping</span>
            Shipping To
          </h3>
          <div className="text-sm text-[#d4c5a0] leading-relaxed">
            <p className="font-semibold text-[#f5ead0]">{addr.full_name}</p>
            <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
            <p>{addr.city}, {addr.state} – {addr.pincode}</p>
            <p className="text-[#c9a84c]/60 text-xs mt-1">{addr.phone}</p>
          </div>
        </div>
      )}

      {/* Tracking info */}
      {order.shipment?.tracking_number && (
        <div className="bg-[#234d37] rounded-2xl border border-[#c9a84c]/15 p-6 mb-4">
          <h3 className="font-bold text-[#f5ead0] mb-3 flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[#c9a84c] text-[18px]">package_2</span>
            Tracking
          </h3>
          <p className="text-sm text-[#d4c5a0]">
            {order.shipment.carrier} · <span className="font-semibold text-[#f5ead0]">{order.shipment.tracking_number}</span>
            {order.shipment.tracking_url && (
              <a href={order.shipment.tracking_url} target="_blank" rel="noreferrer" className="ml-3 text-[#c9a84c] hover:underline text-xs font-bold">
                Track Package →
              </a>
            )}
          </p>
          {order.estimated_delivery && (
            <p className="text-xs text-[#c9a84c]/60 mt-1">
              Estimated delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/products"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#c9a84c]/30 text-[#c9a84c] font-bold py-3 hover:bg-[#c9a84c]/10 transition-colors no-underline text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">storefront</span>
          Continue Shopping
        </Link>
        <Link
          to="/profile"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#c9a84c] text-[#0f2419] font-bold py-3 hover:bg-[#e8c96a] transition-colors no-underline text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          View My Orders
        </Link>
      </div>
    </div>
  );
}
