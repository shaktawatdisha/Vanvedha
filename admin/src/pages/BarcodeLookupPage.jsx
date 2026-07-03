import { useEffect, useRef, useState } from 'react';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

const SPICE_COLORS = {
  CHILLI:    'bg-red-100 text-red-700',
  TURMERIC:  'bg-yellow-100 text-yellow-700',
  CORIANDER: 'bg-green-100 text-green-700',
  OTHER:     'bg-stone-100 text-stone-600',
};

function RawLotResult({ record }) {
  const pct = +record.quantity_kg > 0
    ? Math.round((+record.quantity_remaining_kg / +record.quantity_kg) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-600">package_2</span>
        </div>
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Raw Material Lot</p>
          <p className="font-mono font-bold text-stone-800 text-lg">{record.barcode}</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${SPICE_COLORS[record.spice_type]}`}>
          {record.spice_type_label}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <Detail label="Supplier" value={record.supplier_name} />
        <Detail label="Purchase Date" value={record.purchase_date} />
        <Detail label="Total Purchased" value={`${record.quantity_kg} kg`} />
        <Detail label="Price / kg" value={`₹${record.price_per_kg}`} />
      </div>

      {/* Stock remaining bar */}
      <div className="bg-stone-50 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Stock Remaining</span>
          <span className="font-bold text-stone-800">{record.quantity_remaining_kg} kg <span className="text-stone-400 font-normal">of {record.quantity_kg} kg</span></span>
        </div>
        <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`text-xs mt-1.5 font-semibold ${pct > 50 ? 'text-emerald-600' : pct > 20 ? 'text-amber-600' : 'text-red-600'}`}>
          {pct}% remaining {pct <= 20 && '— Low stock'}
        </p>
      </div>

      {record.notes && (
        <Detail label="Notes" value={record.notes} full />
      )}
    </div>
  );
}

function BatchResult({ record }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-violet-600">blender</span>
        </div>
        <div>
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Processing Batch</p>
          <p className="font-mono font-bold text-stone-800 text-lg">{record.barcode}</p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${record.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          <span className="material-symbols-outlined text-sm">{record.status === 'CONFIRMED' ? 'check_circle' : 'pending'}</span>
          {record.status_label}
        </span>
      </div>

      {/* Output product */}
      <div className="bg-stone-50 rounded-xl p-4">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Finished Product</p>
        <p className="font-semibold text-stone-800">{record.variant_name}</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Detail label="Processed (kg)" value={`${record.output_quantity_kg} kg`} />
          <Detail label="Packs Produced" value={record.output_units} />
          <Detail label="Processed Date" value={record.processed_date} />
        </div>
      </div>

      {/* Raw lot traceability */}
      <div>
        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Raw Material Used (Traceability)</p>
        <div className="flex flex-col gap-2">
          {record.raw_usages?.map((u, i) => (
            <div key={i} className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-stone-400 text-lg">package_2</span>
                <div>
                  <p className="font-mono text-sm font-bold text-stone-700">{u.lot_barcode}</p>
                  <p className="text-xs text-stone-400">{u.lot_spice}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-stone-600">{u.quantity_used_kg} kg used</span>
            </div>
          ))}
        </div>
      </div>

      {record.notes && <Detail label="Notes" value={record.notes} full />}
    </div>
  );
}

function Detail({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-stone-700 mt-0.5">{value || '—'}</p>
    </div>
  );
}

export default function BarcodeLookupPage() {
  const inputRef = useRef(null);
  const [barcode, setBarcode] = useState('');
  const [result, setResult] = useState(null);   // { type, record }
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState('');

  // Auto-focus the input on mount so scanner can fire immediately
  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = async (code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setLastScanned(trimmed);
    try {
      const { data } = await adminApi.barcodeLookup(trimmed);
      setResult(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No record found for "${trimmed}"`);
      } else {
        setError('Lookup failed — check your connection.');
      }
    } finally {
      setLoading(false);
      setBarcode('');
      // Re-focus for next scan
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const onKeyDown = (e) => {
    // Barcode scanners send Enter after the code
    if (e.key === 'Enter') lookup(barcode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Barcode Lookup" />
      <div className="p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">

        {/* Scanner input */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ec4913] text-3xl">barcode_scanner</span>
            <div>
              <h2 className="font-bold text-stone-800 text-base">Scan or type a barcode</h2>
              <p className="text-sm text-stone-400">Point your scanner here, or type the barcode code and press Enter.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">barcode</span>
              <input
                ref={inputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="e.g. RAW-A3F1B2C4D5 or FIN-9E8D7C6B5A"
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-10 pr-4 py-3 border-2 border-[#ec4913]/30 focus:border-[#ec4913] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ec4913]/20 transition-all"
              />
            </div>
            <button
              onClick={() => lookup(barcode)}
              disabled={loading || !barcode.trim()}
              className="px-5 py-3 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#c93a0a] disabled:opacity-50 transition-colors cursor-pointer border-0"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              ) : (
                'Lookup'
              )}
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-xs text-stone-400 text-center">
            Scanner users: keep this page open — the input stays focused between scans automatically.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 flex items-center justify-center gap-3 text-stone-400">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-2xl">progress_activity</span>
            <span className="text-sm">Looking up <span className="font-mono font-bold text-stone-600">{lastScanned}</span>…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 flex items-center gap-4">
            <span className="material-symbols-outlined text-red-400 text-2xl">error</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">{error}</p>
              <p className="text-xs text-stone-400 mt-0.5">Check the barcode and try again.</p>
            </div>
          </div>
        )}

        {/* Result */}
        {!loading && result && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6">
            {result.type === 'raw_lot'
              ? <RawLotResult record={result.record} />
              : <BatchResult record={result.record} />
            }
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-12 flex flex-col items-center gap-3 text-center">
            <span className="material-symbols-outlined text-stone-200 text-6xl">barcode</span>
            <p className="text-stone-400 text-sm">Scan a barcode to see its details here.</p>
            <p className="text-xs text-stone-300">Works with RAW-… (raw material lots) and FIN-… (finished batches)</p>
          </div>
        )}

      </div>
    </div>
  );
}
