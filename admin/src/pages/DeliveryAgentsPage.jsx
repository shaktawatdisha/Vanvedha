import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

export default function DeliveryAgentsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-delivery', filter, page],
    queryFn: () => adminApi.getDeliveryAgents({ ...(filter !== '' ? { is_available: filter } : {}), page }).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateDeliveryAgent(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-delivery']); },
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Delivery Agents" />
      <div className="p-6 flex flex-col gap-4">

        {/* Filter */}
        <div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer"
          >
            <option value="">All Agents</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
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
                    {['Name', 'Email', 'Phone', 'Vehicle', 'Reg. Number', 'Zone', 'Availability', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-stone-400">No delivery agents found</td></tr>
                  )}
                  {data?.results?.map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-800 text-sm whitespace-nowrap">{a.user_name}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{a.user_email}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{a.user_phone || '—'}</td>
                      <td className="px-4 py-3 text-stone-600 text-sm capitalize">{a.vehicle_type}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm font-mono">{a.vehicle_number || '—'}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{a.current_zone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${a.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className="material-symbols-outlined text-xs mr-1">{a.is_available ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                          {a.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => updateMut.mutate({ id: a.id, data: { is_available: !a.is_available } })}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer border-0 ${
                            a.is_available
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {a.is_available ? 'Set Unavailable' : 'Set Available'}
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
    </div>
  );
}
