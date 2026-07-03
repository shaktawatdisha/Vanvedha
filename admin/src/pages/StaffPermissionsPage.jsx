import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

const ACTIONS = [
  { key: 'can_view',   label: 'View' },
  { key: 'can_create', label: 'Create' },
  { key: 'can_edit',   label: 'Edit' },
  { key: 'can_delete', label: 'Delete' },
];

function buildEmptyGrid(modules) {
  return modules.reduce((acc, m) => {
    acc[m.value] = { module: m.value, can_view: false, can_create: false, can_edit: false, can_delete: false };
    return acc;
  }, {});
}

// ── Staff Permission Modal (Create / Edit) ──────────────────────────────────────
function StaffPermissionModal({ permission, modules, onClose }) {
  const isEdit = !!permission;
  const qc = useQueryClient();

  const [name, setName] = useState(permission?.name ?? '');
  const [description, setDescription] = useState(permission?.description ?? '');
  const [grid, setGrid] = useState(() => {
    const base = buildEmptyGrid(modules);
    (permission?.module_permissions ?? []).forEach((row) => { base[row.module] = { ...base[row.module], ...row }; });
    return base;
  });
  const [saving, setSaving] = useState(false);

  const toggle = (moduleValue, actionKey) => {
    setGrid((g) => ({ ...g, [moduleValue]: { ...g[moduleValue], [actionKey]: !g[moduleValue][actionKey] } }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    const payload = {
      name: name.trim(),
      description,
      module_permissions: Object.values(grid),
    };
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateStaffPermission(permission.id, payload);
      } else {
        await adminApi.createStaffPermission(payload);
      }
      toast.success(isEdit ? 'Staff permission updated' : 'Staff permission created');
      qc.invalidateQueries({ queryKey: ['admin-staff-permissions'] });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <h2 className="font-bold text-stone-800 text-lg">{isEdit ? 'Edit Staff Permission' : 'New Staff Permission'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Order Manager, Accounts Staff…"
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short description"
              className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-2">Module Permissions</label>
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="px-3 py-2.5 text-center text-xs font-semibold text-stone-500 uppercase tracking-wider">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {modules.map((m) => (
                    <tr key={m.value}>
                      <td className="px-4 py-3 font-medium text-stone-700">{m.label}</td>
                      {ACTIONS.map((a) => (
                        <td key={a.key} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!grid[m.value]?.[a.key]}
                            onChange={() => toggle(m.value, a.key)}
                            className="h-4 w-4 accent-[#ec4913] cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer border-0">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Staff Permission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function StaffPermissionsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'create' | permission object

  const { data: modules } = useQuery({
    queryKey: ['admin-staff-modules'],
    queryFn: () => adminApi.getStaffModules().then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-staff-permissions'],
    queryFn: () => adminApi.getStaffPermissions().then((r) => r.data),
  });

  const permissions = Array.isArray(data) ? data : (data?.results ?? []);

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteStaffPermission(id),
    onSuccess: () => { toast.success('Staff permission deleted'); qc.invalidateQueries({ queryKey: ['admin-staff-permissions'] }); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Cannot delete staff permission'),
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Staff Permissions" />
      <div className="p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-500">Reusable permission "tags" that can be assigned to staff users.</p>
          <button
            onClick={() => setModal('create')}
            disabled={!modules}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] transition-colors cursor-pointer border-0 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Staff Permission
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-stone-100 py-12 text-center text-stone-400">
                <span className="material-symbols-outlined text-3xl block mb-2">badge</span>
                No staff permissions yet. Create one to get started.
              </div>
            )}
            {permissions.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-800">{p.name}</h3>
                    {p.description && <p className="text-xs text-stone-500 mt-0.5">{p.description}</p>}
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs">badge</span>
                    {p.staff_count} staff
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {p.module_permissions.filter((mp) => mp.can_view || mp.can_create || mp.can_edit || mp.can_delete).map((mp) => (
                    <div key={mp.module} className="flex items-center justify-between text-xs">
                      <span className="text-stone-600">{mp.module_label}</span>
                      <span className="text-stone-400 font-mono">
                        {[mp.can_view && 'V', mp.can_create && 'C', mp.can_edit && 'E', mp.can_delete && 'D'].filter(Boolean).join('') || '—'}
                      </span>
                    </div>
                  ))}
                  {p.module_permissions.every((mp) => !mp.can_view && !mp.can_create && !mp.can_edit && !mp.can_delete) && (
                    <p className="text-xs text-stone-400 italic">No permissions granted</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 mt-auto border-t border-stone-50">
                  <button
                    onClick={() => setModal(p)}
                    className="flex-1 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer border-0 bg-transparent"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete staff permission "${p.name}"?`)) deleteMut.mutate(p.id);
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && modules && (
        <StaffPermissionModal
          permission={modal === 'create' ? null : modal}
          modules={modules}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
