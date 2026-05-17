import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

export default function VendorsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors', filter],
    queryFn: () => adminApi.getVendors(filter !== '' ? { is_approved: filter } : {}).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['admin-vendors']);
  const approveMut = useMutation({ mutationFn: (id) => adminApi.approveVendor(id), onSuccess: () => { toast.success('Vendor approved'); invalidate(); } });
  const rejectMut  = useMutation({ mutationFn: (id) => adminApi.rejectVendor(id),  onSuccess: () => { toast.success('Vendor rejected'); invalidate(); } });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Vendors" />
      <div className="p-6 flex flex-col gap-4">

        {/* Filter */}
        <div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer"
          >
            <option value="">All Vendors</option>
            <option value="true">Approved</option>
            <option value="false">Pending Approval</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['Shop Name', 'Owner', 'Email', 'GSTIN', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-stone-400">No vendors found</td></tr>
                  )}
                  {data?.results?.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-stone-800 text-sm">{v.shop_name}</td>
                      <td className="px-4 py-3 text-stone-600 text-sm">{v.user_name}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{v.user_email}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm font-mono">{v.gstin || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${v.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          <span className="material-symbols-outlined text-xs mr-1">{v.is_approved ? 'check_circle' : 'schedule'}</span>
                          {v.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!v.is_approved
                          ? <button onClick={() => approveMut.mutate(v.id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer border-0">Approve</button>
                          : <button onClick={() => rejectMut.mutate(v.id)} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0">Revoke</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.count > 0 && (
              <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400">
                Showing {data.results?.length} of {data.count} vendors
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
