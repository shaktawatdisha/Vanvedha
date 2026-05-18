import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import AdminTopbar from '../../components/layout/AdminTopbar';

const ROLES = ['', 'CUSTOMER', 'VENDOR', 'DELIVERY', 'ADMIN'];

const roleBorderColor = {
  CUSTOMER: 'border-sky-400 text-sky-700',
  VENDOR:   'border-violet-400 text-violet-700',
  DELIVERY: 'border-emerald-400 text-emerald-700',
  ADMIN:    'border-red-400 text-red-700',
};

const inputCls = 'border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white';
const thCls    = 'px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider';
const tdCls    = 'px-5 py-3 text-sm text-stone-700 align-middle';

const labelColors = {
  HOME:  'bg-sky-100 text-sky-700',
  WORK:  'bg-violet-100 text-violet-700',
  OTHER: 'bg-stone-100 text-stone-600',
};

function AddressesModal({ user, onClose }) {
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['admin-user-addresses', user.id],
    queryFn: () => adminApi.getUserAddresses(user.id).then((r) => r.data),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-black text-stone-900 text-lg">Saved Addresses</h2>
            <p className="text-xs text-stone-400 mt-0.5">{user.full_name} · {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-stone-400">
              <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
            </div>
          )}

          {!isLoading && (!addresses || addresses.length === 0) && (
            <div className="flex flex-col items-center py-12 text-stone-400 gap-2">
              <span className="material-symbols-outlined text-4xl">location_off</span>
              <p className="text-sm font-medium">No saved addresses</p>
            </div>
          )}

          {addresses?.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-xl border p-4 ${addr.is_default ? 'border-[#ec4913]/30 bg-[#ec4913]/3' : 'border-stone-200'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${labelColors[addr.label] || 'bg-stone-100 text-stone-600'}`}>
                  {addr.label}
                </span>
                {addr.is_default && (
                  <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Default
                  </span>
                )}
              </div>
              <div className="text-sm text-stone-700 leading-relaxed">
                <p className="font-semibold text-stone-900">{addr.full_name}</p>
                <p>{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                <p className="text-stone-400 text-xs mt-1">{addr.phone} · {addr.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ role: '', is_active: '', search: '' });
  const [addressesUser, setAddressesUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () =>
      adminApi
        .getUsers(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')))
        .then((r) => r.data),
  });

  const activateMut   = useMutation({ mutationFn: (id) => adminApi.activateUser(id),   onSuccess: () => { toast.success('User activated');   qc.invalidateQueries(['admin-users']); } });
  const deactivateMut = useMutation({ mutationFn: (id) => adminApi.deactivateUser(id), onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries(['admin-users']); } });
  const verifyMut     = useMutation({ mutationFn: (id) => adminApi.verifyUser(id),     onSuccess: () => { toast.success('User verified');    qc.invalidateQueries(['admin-users']); } });
  const roleMut       = useMutation({ mutationFn: ({ id, role }) => adminApi.changeRole(id, role), onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['admin-users']); } });

  return (
    <div className="flex flex-col">
      <AdminTopbar title="Users" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            placeholder="Search name / email..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className={`${inputCls} flex-1 min-w-[200px]`}
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))}
            className={inputCls}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r || 'All Roles'}</option>
            ))}
          </select>
          <select
            value={filters.is_active}
            onChange={(e) => setFilters((f) => ({ ...f, is_active: e.target.value }))}
            className={inputCls}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
                    {['Name', 'Email', 'Phone', 'Role', 'Status', 'Verified', 'Actions'].map((h) => (
                      <th key={h} className={thCls}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.results?.map((u) => (
                    <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className={tdCls}>{u.full_name}</td>
                      <td className={tdCls}>{u.email}</td>
                      <td className={tdCls}>{u.phone || '—'}</td>
                      <td className={tdCls}>
                        <select
                          defaultValue={u.role}
                          onChange={(e) => roleMut.mutate({ id: u.id, role: e.target.value })}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 ${roleBorderColor[u.role] || 'border-stone-300 text-stone-600'}`}
                        >
                          {['CUSTOMER', 'VENDOR', 'DELIVERY', 'ADMIN'].map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className={tdCls}>
                        <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={tdCls}>
                        {u.is_verified ? (
                          <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                        ) : (
                          <span className="material-symbols-outlined text-red-400 text-lg">cancel</span>
                        )}
                      </td>
                      <td className={`${tdCls} flex gap-2 flex-wrap`}>
                        {u.is_active ? (
                          <button
                            onClick={() => deactivateMut.mutate(u.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors cursor-pointer border-0"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => activateMut.mutate(u.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors cursor-pointer border-0"
                          >
                            Activate
                          </button>
                        )}
                        {!u.is_verified && (
                          <button
                            onClick={() => verifyMut.mutate(u.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer border-0"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => setAddressesUser(u)}
                          title="View addresses"
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer border-0 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          Addresses
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!data?.results?.length && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-stone-400 text-sm">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {addressesUser && (
        <AddressesModal user={addressesUser} onClose={() => setAddressesUser(null)} />
      )}
    </div>
  );
}
