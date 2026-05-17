import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import AdminTopbar from '../../components/layout/AdminTopbar';

const inputCls = 'border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white';
const thCls    = 'px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider';
const tdCls    = 'px-5 py-3 text-sm text-stone-700 align-middle';

export default function AdminDeliveryAgents() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-delivery', filter],
    queryFn: () =>
      adminApi.getDeliveryAgents(filter !== '' ? { is_available: filter } : {}).then((r) => r.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateDeliveryAgent(id, data),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-delivery']); },
  });

  return (
    <div className="flex flex-col">
      <AdminTopbar title="Delivery Agents" />

      <div className="p-6">
        {/* Filter bar */}
        <div className="flex gap-3 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={inputCls}
          >
            <option value="">All Agents</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
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
                    {['Name', 'Email', 'Phone', 'Vehicle', 'Number', 'Zone', 'Available', 'Action'].map((h) => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((a) => (
                    <tr key={a.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className={tdCls}>{a.user_name}</td>
                      <td className={tdCls}>{a.user_email}</td>
                      <td className={tdCls}>{a.user_phone || '—'}</td>
                      <td className={tdCls}>{a.vehicle_type}</td>
                      <td className={tdCls}>{a.vehicle_number || '—'}</td>
                      <td className={tdCls}>{a.current_zone || '—'}</td>
                      <td className={tdCls}>
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${
                            a.is_available
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {a.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <button
                          onClick={() => updateMut.mutate({ id: a.id, data: { is_available: !a.is_available } })}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
                  {!data?.results?.length && (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-stone-400 text-sm">No delivery agents found.</td>
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
