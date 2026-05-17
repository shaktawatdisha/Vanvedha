import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import AdminTopbar from '../../components/layout/AdminTopbar';

const inputCls = 'border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white';
const thCls    = 'px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider';
const tdCls    = 'px-5 py-3 text-sm text-stone-700 align-middle';

export default function AdminVendors() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', filter],
    queryFn: () =>
      adminApi.getVendors(filter !== '' ? { is_approved: filter } : {}).then((r) => r.data),
  });

  const approveMut = useMutation({
    mutationFn: (id) => adminApi.approveVendor(id),
    onSuccess: () => { toast.success('Vendor approved'); qc.invalidateQueries(['admin-vendors']); },
  });
  const rejectMut = useMutation({
    mutationFn: (id) => adminApi.rejectVendor(id),
    onSuccess: () => { toast.success('Vendor rejected'); qc.invalidateQueries(['admin-vendors']); },
  });

  return (
    <div className="flex flex-col">
      <AdminTopbar title="Vendors" />

      <div className="p-6">
        {/* Filter bar */}
        <div className="flex gap-3 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">All Vendors</option>
            <option value="true">Approved</option>
            <option value="false">Pending Approval</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-stone-400">
            <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="w-full bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-stone-50">
                  <tr>
                    {['Shop Name', 'Owner', 'Email', 'GSTIN', 'Status', 'Actions'].map((h) => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((v) => (
                    <tr key={v.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className={tdCls}>
                        <span className="font-semibold text-stone-800">{v.shop_name}</span>
                      </td>
                      <td className={tdCls}>{v.user_name}</td>
                      <td className={tdCls}>{v.user_email}</td>
                      <td className={tdCls}>{v.gstin || '—'}</td>
                      <td className={tdCls}>
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                            v.is_approved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {v.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className={tdCls}>
                        {!v.is_approved ? (
                          <button
                            onClick={() => approveMut.mutate(v.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => rejectMut.mutate(v.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!data?.results?.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-stone-400 text-sm">No vendors found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
