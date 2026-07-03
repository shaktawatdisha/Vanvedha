import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const EMPTY = { name: '', phone: '', address: '' };

function SupplierModal({ initial, onClose, onSave, loading }) {
  const [form, setForm] = useState(initial || EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-800">{initial ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Name *</label>
            <input value={form.name} onChange={set('name')} placeholder="Supplier name"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Phone</label>
            <input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Address</label>
            <textarea value={form.address} onChange={set('address')} rows={3} placeholder="Village / City, State"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 cursor-pointer bg-white">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading || !form.name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ec4913] hover:bg-[#c93a0a] disabled:opacity-50 cursor-pointer border-0">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', supplier? }
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: () => adminApi.getSuppliers({ ...(search ? { search } : {}), page }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['suppliers']);

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createSupplier(data),
    onSuccess: () => { toast.success('Supplier added'); setModal(null); invalidate(); },
    onError:   () => toast.error('Failed to save supplier'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateSupplier(id, data),
    onSuccess: () => { toast.success('Supplier updated'); setModal(null); invalidate(); },
    onError:   () => toast.error('Failed to update supplier'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteSupplier(id),
    onSuccess: () => { toast.success('Supplier deleted'); invalidate(); },
    onError:   () => toast.error('Failed to delete supplier'),
  });

  const handleSave = (form) => {
    if (modal.mode === 'add') createMut.mutate(form);
    else updateMut.mutate({ id: modal.supplier.id, data: form });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Suppliers" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or phone…"
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-full" />
          </div>
          <button onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#c93a0a] transition-colors cursor-pointer border-0">
            <span className="material-symbols-outlined text-lg">add</span> Add Supplier
          </button>
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
                    {['Name', 'Phone', 'Address', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-stone-400">No suppliers yet</td></tr>
                  )}
                  {data?.results?.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-stone-800 text-sm">{s.name}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{s.phone || '—'}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm max-w-xs truncate">{s.address || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModal({ mode: 'edit', supplier: s })}
                            className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0">
                            Edit
                          </button>
                          <button onClick={() => { if (window.confirm(`Delete ${s.name}?`)) deleteMut.mutate(s.id); }}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0">
                            Delete
                          </button>
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

      {modal && (
        <SupplierModal
          initial={modal.supplier}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={isSaving}
        />
      )}
    </div>
  );
}
