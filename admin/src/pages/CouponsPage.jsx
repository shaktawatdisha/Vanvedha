import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const schema = z.object({
  code:           z.string().min(2, 'Min 2 chars').max(20, 'Max 20 chars').toUpperCase(),
  description:    z.string().optional(),
  discount_type:  z.enum(['PERCENT', 'FLAT']),
  discount_value: z.coerce.number().positive('Must be positive'),
  min_order_value:z.coerce.number().min(0).default(0),
  max_discount:   z.coerce.number().positive().optional().or(z.literal('')),
  usage_limit:    z.coerce.number().int().positive().optional().or(z.literal('')),
  valid_from:     z.string().min(1, 'Required'),
  valid_until:    z.string().min(1, 'Required'),
  is_single_use:  z.boolean().default(false),
});

function CreateCouponModal({ onClose, onCreated }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { discount_type: 'PERCENT', min_order_value: 0, is_single_use: false },
  });

  const onSubmit = async (values) => {
    const payload = { ...values };
    if (!payload.max_discount) delete payload.max_discount;
    if (!payload.usage_limit) delete payload.usage_limit;
    try {
      await adminApi.createCoupon(payload);
      toast.success('Coupon created');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.code?.[0] || 'Failed to create coupon');
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]";
  const labelCls = "block text-xs font-semibold text-stone-600 mb-1";
  const errCls   = "text-red-500 text-xs mt-0.5";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-bold text-stone-800">Create Coupon</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Coupon Code</label>
            <input {...register('code')} placeholder="SAVE20" className={`${inputCls} uppercase`} />
            {errors.code && <p className={errCls}>{errors.code.message}</p>}
          </div>

          <div className="col-span-2">
            <label className={labelCls}>Description</label>
            <input {...register('description')} placeholder="Optional description" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Discount Type</label>
            <select {...register('discount_type')} className={inputCls}>
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Discount Value</label>
            <input {...register('discount_value')} type="number" step="0.01" placeholder="20" className={inputCls} />
            {errors.discount_value && <p className={errCls}>{errors.discount_value.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Min Order Value (₹)</label>
            <input {...register('min_order_value')} type="number" step="0.01" placeholder="0" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Max Discount (₹, optional)</label>
            <input {...register('max_discount')} type="number" step="0.01" placeholder="Leave blank for no cap" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Usage Limit (optional)</label>
            <input {...register('usage_limit')} type="number" placeholder="Leave blank for unlimited" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Single Use Per User</label>
            <div className="flex items-center gap-2 h-10">
              <input {...register('is_single_use')} type="checkbox" id="single_use" className="w-4 h-4 accent-[#ec4913]" />
              <label htmlFor="single_use" className="text-sm text-stone-600">One use per customer</label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Valid From</label>
            <input {...register('valid_from')} type="datetime-local" className={inputCls} />
            {errors.valid_from && <p className={errCls}>{errors.valid_from.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Valid Until</label>
            <input {...register('valid_until')} type="datetime-local" className={inputCls} />
            {errors.valid_until && <p className={errCls}>{errors.valid_until.message}</p>}
          </div>

          <div className="col-span-2 flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer">
              {isSubmitting ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons', page],
    queryFn: () => adminApi.getCoupons({ page }).then(r => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteCoupon(id),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries(['admin-coupons']); },
  });

  const isExpired = (until) => new Date(until) < new Date();

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Coupons" />
      <div className="p-6 flex flex-col gap-4">

        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] transition-colors cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Coupon
          </button>
        </div>

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
                    {['Code', 'Type', 'Discount', 'Min Order', 'Usage', 'Valid Until', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-stone-400">No coupons found</td></tr>
                  )}
                  {data?.results?.map(c => (
                    <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800 text-sm">{c.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.discount_type === 'PERCENT' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                          {c.discount_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-[#ec4913]">
                        {c.discount_type === 'PERCENT' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">₹{c.min_order_value}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">
                        {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                        {new Date(c.valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isExpired(c.valid_until) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {isExpired(c.valid_until) ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) deleteMut.mutate(c.id); }}
                          className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0"
                        >
                          Delete
                        </button>
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

      {showCreate && (
        <CreateCouponModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); qc.invalidateQueries(['admin-coupons']); }}
        />
      )}
    </div>
  );
}
