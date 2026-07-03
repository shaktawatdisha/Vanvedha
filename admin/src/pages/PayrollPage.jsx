import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

const EMPTY_SALARY = { user: '', base_salary: '', effective_from: '', notes: '' };
const EMPTY_PAYMENT = { month: '', amount: '', notes: '' };

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-700',
  PAID:    'bg-emerald-100 text-emerald-700',
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function SalaryModal({ initial, staffOptions, onClose, onSave, loading }) {
  const [form, setForm] = useState(
    initial
      ? { user: initial.user, base_salary: initial.base_salary, effective_from: initial.effective_from, notes: initial.notes || '' }
      : EMPTY_SALARY
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.user && form.base_salary && form.effective_from;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-800">{initial ? 'Edit Salary' : 'Add Staff Salary'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Staff Member *</label>
            {initial ? (
              <p className="mt-1 px-3 py-2.5 bg-stone-50 rounded-xl text-sm text-stone-700">{initial.user_name} ({initial.user_email})</p>
            ) : (
              <select value={form.user} onChange={set('user')}
                className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white">
                <option value="">Select staff member…</option>
                {staffOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Base Salary (₹/mo) *</label>
            <input type="number" min="0" step="0.01" value={form.base_salary} onChange={set('base_salary')} placeholder="25000"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Effective From *</label>
            <input type="date" value={form.effective_from} onChange={set('effective_from')}
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional"
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 resize-none" />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-600 border border-stone-200 hover:bg-stone-50 cursor-pointer bg-white">
            Cancel
          </button>
          <button onClick={() => onSave(form)} disabled={loading || !valid}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#ec4913] hover:bg-[#c93a0a] disabled:opacity-50 cursor-pointer border-0">
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentsModal({ salary, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_PAYMENT);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const { data, isLoading } = useQuery({
    queryKey: ['salary-payments', salary.id],
    queryFn: () => adminApi.getSalaryPayments({ staff_salary: salary.id, page_size: 100 }).then((r) => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['salary-payments', salary.id] });
    qc.invalidateQueries({ queryKey: ['staff-salaries'] });
  };

  const addMut = useMutation({
    mutationFn: (payload) => adminApi.createSalaryPayment({ ...payload, staff_salary: salary.id }),
    onSuccess: () => { toast.success('Payment record added'); setForm(EMPTY_PAYMENT); invalidate(); },
    onError:   (err) => toast.error(err.response?.data?.month?.[0] || 'Failed to add payment'),
  });
  const markPaidMut = useMutation({
    mutationFn: (id) => adminApi.markSalaryPaymentPaid(id),
    onSuccess: () => { toast.success('Marked as paid'); invalidate(); },
    onError:   () => toast.error('Failed to update payment'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteSalaryPayment(id),
    onSuccess: () => { toast.success('Payment deleted'); invalidate(); },
    onError:   () => toast.error('Failed to delete payment'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-800">Payment History</h2>
            <p className="text-xs text-stone-500">{salary.user_name} · ₹{salary.base_salary}/mo</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 bg-transparent border-0 cursor-pointer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Add payment row */}
        <div className="flex items-end gap-2 bg-stone-50 rounded-xl p-3 flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Month</label>
            <input type="date" value={form.month} onChange={set('month')}
              className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div className="flex-1 min-w-24">
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Amount</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder={salary.base_salary}
              className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Notes</label>
            <input value={form.notes} onChange={set('notes')} placeholder="Optional"
              className="mt-1 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30" />
          </div>
          <button
            onClick={() => addMut.mutate({ month: form.month, amount: form.amount || salary.base_salary, notes: form.notes })}
            disabled={addMut.isPending || !form.month}
            className="px-4 py-2 bg-[#ec4913] text-white text-sm font-semibold rounded-lg hover:bg-[#c93a0a] disabled:opacity-50 cursor-pointer border-0">
            Add
          </button>
        </div>

        {/* Payments table */}
        <div className="overflow-auto flex-1 border border-stone-100 rounded-xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <span className="material-symbols-outlined animate-spin text-[#ec4913] text-3xl">progress_activity</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100 sticky top-0">
                <tr>
                  {['Month', 'Amount', 'Status', 'Paid On', 'Notes', ''].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {data?.results?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-stone-400 text-sm">No payment records yet</td></tr>
                )}
                {data?.results?.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-3 py-2 text-sm text-stone-700">{p.month}</td>
                    <td className="px-3 py-2 text-sm font-semibold text-stone-800">₹{p.amount}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-sm text-stone-500">{p.paid_on || '—'}</td>
                    <td className="px-3 py-2 text-sm text-stone-500 max-w-40 truncate">{p.notes || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        {p.status === 'PENDING' && (
                          <button onClick={() => markPaidMut.mutate(p.id)}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 cursor-pointer border-0">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => { if (window.confirm('Delete this payment record?')) deleteMut.mutate(p.id); }}
                          className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 cursor-pointer border-0">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', salary? }
  const [paymentsFor, setPaymentsFor] = useState(null); // salary object
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-salaries', search, page],
    queryFn: () => adminApi.getStaffSalaries({ ...(search ? { search } : {}), page }).then((r) => r.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['admin-users', 'STAFF'],
    queryFn: () => adminApi.getUsers({ role: 'STAFF', page_size: 100 }).then((r) => r.data),
  });
  const existingUserIds = new Set((data?.results || []).map((s) => s.user));
  const staffOptions = (staffData?.results || []).filter((u) => !existingUserIds.has(u.id));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['staff-salaries'] });

  const createMut = useMutation({
    mutationFn: (payload) => adminApi.createStaffSalary(payload),
    onSuccess: () => { toast.success('Salary added'); setModal(null); invalidate(); },
    onError:   (err) => toast.error(err.response?.data?.user?.[0] || 'Failed to save salary'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateStaffSalary(id, data),
    onSuccess: () => { toast.success('Salary updated'); setModal(null); invalidate(); },
    onError:   () => toast.error('Failed to update salary'),
  });
  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteStaffSalary(id),
    onSuccess: () => { toast.success('Salary config deleted'); invalidate(); },
    onError:   () => toast.error('Failed to delete'),
  });
  const generateMut = useMutation({
    mutationFn: () => adminApi.generatePayroll(currentMonth()),
    onSuccess: (res) => { toast.success(`Generated ${res.data.created} payment record(s) for this month`); invalidate(); },
    onError:   () => toast.error('Failed to generate payroll'),
  });

  const handleSave = (form) => {
    if (modal.mode === 'add') createMut.mutate(form);
    else updateMut.mutate({ id: modal.salary.id, data: { base_salary: form.base_salary, effective_from: form.effective_from, notes: form.notes } });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Staff Payroll" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search staff name or email…"
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-full" />
          </div>
          <button onClick={() => generateMut.mutate()} disabled={generateMut.isPending}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-stone-700 border border-stone-200 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">event_repeat</span>
            {generateMut.isPending ? 'Generating…' : "Generate This Month's Payroll"}
          </button>
          <button onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white text-sm font-semibold rounded-xl hover:bg-[#c93a0a] transition-colors cursor-pointer border-0">
            <span className="material-symbols-outlined text-lg">add</span> Add Salary
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
                    {['Staff', 'Base Salary', 'Effective From', 'Pending', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-stone-400">No staff salaries configured yet</td></tr>
                  )}
                  {data?.results?.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-stone-800 text-sm">{s.user_name}</p>
                        <p className="text-xs text-stone-400">{s.user_email}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-700 text-sm font-semibold">₹{s.base_salary}</td>
                      <td className="px-4 py-3 text-stone-500 text-sm">{s.effective_from}</td>
                      <td className="px-4 py-3">
                        {s.pending_count > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{s.pending_count} pending</span>
                        ) : (
                          <span className="text-xs text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setPaymentsFor(s)}
                            className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0">
                            Payments
                          </button>
                          <button onClick={() => setModal({ mode: 'edit', salary: s })}
                            className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0">
                            Edit
                          </button>
                          <button onClick={() => { if (window.confirm(`Remove salary config for ${s.user_name}?`)) deleteMut.mutate(s.id); }}
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
        <SalaryModal
          initial={modal.salary}
          staffOptions={staffOptions}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={isSaving}
        />
      )}

      {paymentsFor && (
        <PaymentsModal salary={paymentsFor} onClose={() => setPaymentsFor(null)} />
      )}
    </div>
  );
}
