import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

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

const EMPTY_USAGE = { raw_lot: '', quantity_used_kg: '' };

function BatchModal({ initial, rawLots, products, onClose, onSave, loading }) {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState(
    initial
      ? {
          output_variant: initial.output_variant,
          output_quantity_kg: initial.output_quantity_kg,
          output_units: initial.output_units,
          processed_date: initial.processed_date,
          notes: initial.notes,
        }
      : { output_variant: '', output_quantity_kg: '', output_units: '', processed_date: '', notes: '' }
  );
  const [usages, setUsages] = useState(
    initial?.raw_usages?.length
      ? initial.raw_usages.map((u) => ({ raw_lot: u.raw_lot, quantity_used_kg: u.quantity_used_kg }))
      : [{ ...EMPTY_USAGE }]
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data: variants } = useQuery({
    queryKey: ['variants-for-product', selectedProduct],
    queryFn: () => adminApi.getVariants(selectedProduct).then((r) => r.data),
    enabled: !!selectedProduct,
  });

  const addUsage = () => setUsages((u) => [...u, { ...EMPTY_USAGE }]);
  const removeUsage = (i) => setUsages((u) => u.filter((_, idx) => idx !== i));
  const setUsage = (i, k) => (e) => setUsages((u) => u.map((row, idx) => idx === i ? { ...row, [k]: e.target.value } : row));

  const isValid =
    form.output_variant && form.output_quantity_kg && form.output_units &&
    form.processed_date && usages.every((u) => u.raw_lot && u.quantity_used_kg);

  const handleSave = () => onSave({ ...form, raw_usages: usages });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col gap-0 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="text-base font-bold text-stone-800">{initial ? 'Edit Batch' : 'New Processing Batch'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Output product */}
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Output (Finished Product)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500">Product *</label>
                <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setForm((f) => ({ ...f, output_variant: '' })); }}
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30">
                  <option value="">Select product…</option>
                  {products?.results?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Variant *</label>
                <select value={form.output_variant} onChange={set('output_variant')} disabled={!selectedProduct}
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 disabled:opacity-50">
                  <option value="">Select variant…</option>
                  {variants?.map((v) => <option key={v.id} value={v.id}>{v.weight}{v.unit} — ₹{v.price}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Quantity Processed (kg) *</label>
                <input type="number" min="0" step="0.01" value={form.output_quantity_kg} onChange={set('output_quantity_kg')} placeholder="e.g. 85"
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Packs Produced (units) *</label>
                <input type="number" min="0" step="1" value={form.output_units} onChange={set('output_units')} placeholder="e.g. 850"
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
                <p className="text-xs text-stone-400 mt-1">This number is added to variant stock on confirm.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Processed Date *</label>
                <input type="date" value={form.processed_date} onChange={set('processed_date')}
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500">Notes</label>
                <input value={form.notes} onChange={set('notes')} placeholder="Optional notes"
                  className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
              </div>
            </div>
          </div>

          {/* Raw lot usages */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Raw Material Used</p>
              <button onClick={addUsage}
                className="flex items-center gap-1 text-xs font-semibold text-[#ec4913] hover:text-[#c93a0a] bg-transparent border-0 cursor-pointer">
                <span className="material-symbols-outlined text-base">add_circle</span> Add Lot
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {usages.map((usage, i) => (
                <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3">
                  <select value={usage.raw_lot} onChange={setUsage(i, 'raw_lot')}
                    className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30">
                    <option value="">Select raw lot…</option>
                    {rawLots?.results?.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.barcode} — {lot.spice_type_label} ({lot.quantity_remaining_kg} kg left)
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 shrink-0">
                    <input type="number" min="0" step="0.01" value={usage.quantity_used_kg} onChange={setUsage(i, 'quantity_used_kg')}
                      placeholder="kg used" className="w-24 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
                    <span className="text-xs text-stone-400">kg</span>
                  </div>
                  {usages.length > 1 && (
                    <button onClick={() => removeUsage(i)} className="text-stone-400 hover:text-red-500 bg-transparent border-0 cursor-pointer shrink-0">
                      <span className="material-symbols-outlined text-lg">remove_circle</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!initial && (
            <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-3 py-2">
              A barcode will be auto-generated. Stock is only updated when you click <strong>Confirm</strong> after saving.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 cursor-pointer bg-white">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading || !isValid}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ec4913] hover:bg-[#c93a0a] disabled:opacity-50 cursor-pointer border-0">
            {loading ? 'Saving…' : 'Save Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProcessingBatchesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['batches', statusFilter, page],
    queryFn: () => adminApi.getBatches({ ...(statusFilter ? { status: statusFilter } : {}), page }).then((r) => r.data),
  });

  const { data: rawLots } = useQuery({
    queryKey: ['raw-lots-all'],
    queryFn: () => adminApi.getRawLots({ page_size: 200 }).then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => adminApi.getProducts({ page_size: 200 }).then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['batches']);

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createBatch(data),
    onSuccess: () => { toast.success('Batch saved'); setModal(null); invalidate(); },
    onError: () => toast.error('Failed to save batch'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateBatch(id, data),
    onSuccess: () => { toast.success('Batch updated'); setModal(null); invalidate(); },
    onError: () => toast.error('Failed to update batch'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteBatch(id),
    onSuccess: () => { toast.success('Batch deleted'); invalidate(); },
    onError: () => toast.error('Failed to delete batch'),
  });
  const confirmMut = useMutation({
    mutationFn: (id) => adminApi.confirmBatch(id),
    onSuccess: () => { toast.success('Batch confirmed — stock updated'); invalidate(); },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to confirm batch'),
  });

  const handleSave = (form) => {
    if (modal.mode === 'add') createMut.mutate(form);
    else updateMut.mutate({ id: modal.batch.id, data: form });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Processing Batches" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Batches</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
          </select>
          <button onClick={() => setModal({ mode: 'add' })}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#c93a0a] transition-colors cursor-pointer border-0">
            <span className="material-symbols-outlined text-lg">add</span> New Batch
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
                    {['Barcode', 'Product / Variant', 'Processed (kg)', 'Packs', 'Date', 'Raw Lots', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-stone-400">No batches yet</td></tr>
                  )}
                  {data?.results?.map((batch) => (
                    <tr key={batch.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3"><Barcode code={batch.barcode} /></td>
                      <td className="px-4 py-3 text-stone-700 text-sm font-medium max-w-[180px]">
                        <span className="block truncate">{batch.variant_name}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-600 text-sm">{batch.output_quantity_kg} kg</td>
                      <td className="px-4 py-3 text-stone-600 text-sm font-semibold">{batch.output_units}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm whitespace-nowrap">{batch.processed_date}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {batch.raw_usages?.map((u, i) => (
                            <span key={i} className="text-xs text-stone-500 font-mono">
                              {u.lot_barcode} <span className="text-stone-400">({u.quantity_used_kg} kg)</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${batch.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          <span className="material-symbols-outlined text-xs mr-1">{batch.status === 'CONFIRMED' ? 'check_circle' : 'pending'}</span>
                          {batch.status_label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {batch.status === 'PENDING' && (<>
                            <button onClick={() => setModal({ mode: 'edit', batch })}
                              className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0">
                              Edit
                            </button>
                            <button onClick={() => { if (window.confirm('Confirm this batch? Stock will be updated immediately.')) confirmMut.mutate(batch.id); }}
                              className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer border-0">
                              Confirm
                            </button>
                            <button onClick={() => { if (window.confirm('Delete this batch?')) deleteMut.mutate(batch.id); }}
                              className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0">
                              Delete
                            </button>
                          </>)}
                          {batch.status === 'CONFIRMED' && (
                            <span className="text-xs text-stone-400 italic">Locked</span>
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

      {modal && (
        <BatchModal
          initial={modal.batch}
          rawLots={rawLots}
          products={products}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={isSaving}
        />
      )}
    </div>
  );
}
