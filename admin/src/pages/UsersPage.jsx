import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

const ROLE_COLORS = {
  CUSTOMER: 'bg-sky-100 text-sky-700',
  VENDOR:   'bg-violet-100 text-violet-700',
  DELIVERY: 'bg-emerald-100 text-emerald-700',
  ADMIN:    'bg-red-100 text-red-700',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ role: '', is_active: '', search: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () =>
      adminApi.getUsers(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['admin-users']);

  const activateMut   = useMutation({ mutationFn: (id) => adminApi.activateUser(id),   onSuccess: () => { toast.success('User activated');   invalidate(); } });
  const deactivateMut = useMutation({ mutationFn: (id) => adminApi.deactivateUser(id), onSuccess: () => { toast.success('User deactivated'); invalidate(); } });
  const verifyMut     = useMutation({ mutationFn: (id) => adminApi.verifyUser(id),     onSuccess: () => { toast.success('User verified');    invalidate(); } });
  const roleMut       = useMutation({ mutationFn: ({ id, role }) => adminApi.changeRole(id, role), onSuccess: () => { toast.success('Role updated'); invalidate(); } });

  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Users" />
      <div className="p-6 flex flex-col gap-4">

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input
              placeholder="Search name / email..."
              value={filters.search}
              onChange={set('search')}
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-64"
            />
          </div>
          <select value={filters.role} onChange={set('role')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Roles</option>
            {['CUSTOMER', 'VENDOR', 'DELIVERY', 'ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filters.is_active} onChange={set('is_active')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
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
                    {['Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-stone-400">No users found</td></tr>
                  )}
                  {data?.results?.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-800 text-sm whitespace-nowrap">{u.full_name}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{u.email}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          defaultValue={u.role}
                          onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none ${ROLE_COLORS[u.role] || 'bg-stone-100 text-stone-600'}`}
                        >
                          {['CUSTOMER', 'VENDOR', 'DELIVERY', 'ADMIN'].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          <span className="material-symbols-outlined text-xs mr-1">{u.is_active ? 'check_circle' : 'cancel'}</span>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified
                          ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold"><span className="material-symbols-outlined text-sm">verified</span> Verified</span>
                          : <span className="text-stone-400 text-xs">Unverified</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {u.is_active
                            ? <button onClick={() => deactivateMut.mutate(u.id)} className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0">Deactivate</button>
                            : <button onClick={() => activateMut.mutate(u.id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer border-0">Activate</button>}
                          {!u.is_verified && (
                            <button onClick={() => verifyMut.mutate(u.id)} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition-colors cursor-pointer border-0">Verify</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.count > 0 && (
              <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400">
                Showing {data.results?.length} of {data.count} users
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
