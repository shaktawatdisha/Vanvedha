import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const ROLE_COLORS = {
  CUSTOMER: 'bg-sky-100 text-sky-700',
  DELIVERY: 'bg-emerald-100 text-emerald-700',
  ADMIN:    'bg-red-100 text-red-700',
  STAFF:    'bg-amber-100 text-amber-700',
};

// ── Assign Staff Permission Modal ───────────────────────────────────────────────
function AssignStaffPermissionModal({ user, onClose }) {
  const qc = useQueryClient();
  const [permissionId, setPermissionId] = useState(user.staff_template_id ?? '');
  const [saving, setSaving] = useState(false);

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['admin-staff-permissions'],
    queryFn: () => adminApi.getStaffPermissions().then((r) => r.data),
  });

  const list = Array.isArray(permissions) ? permissions : (permissions?.results ?? []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.assignStaffProfile(user.id, { template: permissionId || null });
      toast.success('Staff permission assigned');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not assign staff permission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800 text-lg">Assign Staff Permission</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 flex flex-col gap-4">
          <p className="text-sm text-stone-500">
            Staff member: <span className="font-semibold text-stone-700">{user.full_name}</span>
          </p>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Staff Permission</label>
            {isLoading ? (
              <p className="text-sm text-stone-400">Loading staff permissions…</p>
            ) : (
              <select
                value={permissionId}
                onChange={(e) => setPermissionId(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913] cursor-pointer"
              >
                <option value="">— No permission —</option>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {list.length === 0 && !isLoading && (
              <p className="text-xs text-stone-400 mt-1">No staff permissions yet — create one under Staff Permissions first.</p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer border-0">
              {saving ? 'Saving…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ role: '', is_active: '', search: '' });
  const [page, setPage] = useState(1);
  const [permissionModalUser, setPermissionModalUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters, page],
    queryFn: () =>
      adminApi.getUsers({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')), page }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['admin-users']);

  const activateMut   = useMutation({ mutationFn: (id) => adminApi.activateUser(id),   onSuccess: () => { toast.success('User activated');   invalidate(); } });
  const deactivateMut = useMutation({ mutationFn: (id) => adminApi.deactivateUser(id), onSuccess: () => { toast.success('User deactivated'); invalidate(); } });
  const verifyMut     = useMutation({ mutationFn: (id) => adminApi.verifyUser(id),     onSuccess: () => { toast.success('User verified');    invalidate(); } });
  const roleMut       = useMutation({
    mutationFn: ({ id, role }) => adminApi.changeRole(id, role),
    onSuccess: (_res, variables) => {
      toast.success('Role updated');
      invalidate();
      if (variables.role === 'STAFF') {
        const user = data?.results?.find((u) => u.id === variables.id);
        if (user) setPermissionModalUser({ ...user, role: 'STAFF' });
      }
    },
  });

  const set = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(1); };

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
            {['CUSTOMER', 'DELIVERY', 'ADMIN', 'STAFF'].map((r) => <option key={r} value={r}>{r}</option>)}
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
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100 sticky top-0 z-10">
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
                        <div className="flex flex-col items-start gap-1.5">
                          <select
                            defaultValue={u.role}
                            onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:outline-none ${ROLE_COLORS[u.role] || 'bg-stone-100 text-stone-600'}`}
                          >
                            {['CUSTOMER', 'DELIVERY', 'ADMIN', 'STAFF'].map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                          {u.role === 'STAFF' && (
                            <button
                              onClick={() => setPermissionModalUser(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
                                u.staff_template_name
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                              }`}
                              title="Click to change the assigned staff permission"
                            >
                              <span className="material-symbols-outlined text-xs">badge</span>
                              {u.staff_template_name || 'No permission'}
                            </button>
                          )}
                        </div>
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
            <Pagination page={page} totalPages={data?.total_pages} count={data?.count} onPageChange={setPage} />
          </div>
        )}
      </div>

      {permissionModalUser && (
        <AssignStaffPermissionModal user={permissionModalUser} onClose={() => setPermissionModalUser(null)} />
      )}
    </div>
  );
}
