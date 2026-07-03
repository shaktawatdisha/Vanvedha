import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const SPICE_TYPES = ['CHILLI', 'TURMERIC', 'CORIANDER', 'OTHER'];
const SPICE_LABELS = { CHILLI: 'Chilli', TURMERIC: 'Turmeric', CORIANDER: 'Coriander', OTHER: 'Other' };
const SPICE_COLORS = {
  CHILLI:    'bg-red-100 text-red-700',
  TURMERIC:  'bg-yellow-100 text-yellow-700',
  CORIANDER: 'bg-green-100 text-green-700',
  OTHER:     'bg-stone-100 text-stone-600',
};

const EMPTY_FORM = { supplier: '', spice_type: 'CHILLI', quantity_kg: '', price_per_kg: '', purchase_date: '', notes: '' };

function Barcode({ code }) {
  const copy = () => { navigator.clipboard.writeText(code); toast.success('Barcode copied'); };
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-stone-700 bg-stone-100 px-2 py-1 rounded-lg tracking-widest">{code}</span>
      <button onClick={copy} className="text-stone-400 hover:text-[#ec4913] cursor-pointer bg-transparent border-0 p-0">
        <span className="material-symbols-outlined text-sm">content_copy</span>
      </button>
    </div>
  );
}

function RawLotModal({ initial, suppliers, onClose, onSave, loading }) {
  const [form, setForm] = useState(
    initial
      ? { supplier: initial.supplier, spice_type: initial.spice_type, quantity_kg: initial.quantity_kg, price_per_kg: initial.price_per_kg, purchase_date: initial.purchase_date, notes: initial.notes }
      : EMPTY_FORM
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isValid = form.supplier && form.spice_type && form.quantity_kg && form.price_per_kg && form.purchase_date;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-800">{initial ? 'Edit Raw Lot' : 'Log Raw Material Purchase'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Supplier *</label>
            <select value={form.supplier} onChange={set('supplier')}
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white">
              <option value="">Select supplier…</option>
              {suppliers?.results?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Spice Type *</label>
            <select value={form.spice_type} onChange={set('spice_type')}
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white">
              {SPICE_TYPES.map((t) => <option key={t} value={t}>{SPICE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Purchase Date *</label>
            <input type="date" value={form.purchase_date} onChange={set('purchase_date')}
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Quantity (kg) *</label>
            <input type="number" min="0" step="0.01" value={form.quantity_kg} onChange={set('quantity_kg')} placeholder="e.g. 100"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Price / kg (₹) *</label>
            <input type="number" min="0" step="0.01" value={form.price_per_kg} onChange={set('price_per_kg')} placeholder="e.g. 85"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Quality notes, source region…"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 resize-none" />
          </div>
        </div>

        {!initial && (
          <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-3 py-2">
            A barcode will be auto-generated when this lot is saved.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 cursor-pointer bg-white">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading || !isValid}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ec4913] hover:bg-[#c93a0a] disabled:opacity-50 cursor-pointer border-0">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RawLotsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({ spice_type: '', supplier: '', search: '' });
  const [page, setPage] = useState(1);
  const set = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  const { data, isLoading } = useQuery({
    queryKey: ['raw-lots', filters, page],
    queryFn: () =>
      adminApi.getRawLots({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page }).then((r) => r.data),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => adminApi.getSuppliers({ page_size: 200 }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['raw-lots']);

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createRawLot(data),
    onSuccess: () => { toast.success('Raw lot logged'); setModal(null); invalidate(); },
    onError: () => toast.error('Failed to save lot'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateRawLot(id, data),
    onSuccess: () => { toast.success('Lot updated'); setModal(null); invalidate(); },
    onError: () => toast.error('Failed to update lot'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteRawLot(id),
    onSuccess: () => { toast.success('Lot deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete lot'),
  });

  const handleSave = (form) => {
    if (modal.mode === 'add') createMut.mutate(form);
    else updateMut.mutate({ id: modal.lot.id, data: form });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  const stockPct = (lot) => {
    if (!lot.quantity_kg || +lot.quantity_kg === 0) return 0;
    return Math.round((+lot.quantity_remaining_kg / +lot.quantity_kg) * 100);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Raw Material Lots" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input value={filters.search} onChange={set('search')} placeholder="Search barcode or notes…"
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-full" />
          </div>
          <select value={filters.spice_type} onChange={set('spice_type')}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Spices</option>
            {SPICE_TYPES.map((t) => <option key={t} value={t}>{SPICE_LABELS[t]}</option>)}
          </select>
          <select value={filters.supplier} onChange={set('supplier')}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Suppliers</option>
            {suppliers?.results?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#c93a0a] transition-colors cursor-pointer border-0">
            <span className="material-symbols-outlined text-lg">add</span> Log Purchase
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
                    {['Barcode', 'Supplier', 'Spice', 'Purchased', 'Remaining', 'Price/kg', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-stone-400">No raw lots yet</td></tr>
                  )}
                  {data?.results?.map((lot) => {
                    const pct = stockPct(lot);
                    return (
                      <tr key={lot.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3"><Barcode code={lot.barcode} /></td>
                        <td className="px-4 py-3 text-stone-700 text-sm font-medium">{lot.supplier_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${SPICE_COLORS[lot.spice_type]}`}>
                            {lot.spice_type_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-600 text-sm font-semibold">{lot.quantity_kg} kg</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-stone-500">{lot.quantity_remaining_kg} kg</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-sm">₹{lot.price_per_kg}</td>
                        <td className="px-4 py-3 text-stone-500 text-sm whitespace-nowrap">{lot.purchase_date}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setModal({ mode: 'edit', lot })}
                              className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0">
                              Edit
                            </button>
                            <button onClick={() => { if (window.confirm('Delete this lot?')) deleteMut.mutate(lot.id); }}
                              className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.total_pages} count={data?.count} onPageChange={setPage} />
          </div>
        )}
      </div>

      {modal && (
        <RawLotModal
          initial={modal.lot}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={isSaving}
        />
      )}
    </div>
  );
}
