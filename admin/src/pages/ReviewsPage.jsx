import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span
          key={s}
          className={`material-symbols-outlined text-sm ${s <= rating ? 'text-amber-400' : 'text-stone-200'}`}
          style={{ fontVariationSettings: s <= rating ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ is_approved: '', rating: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', filters, page],
    queryFn: () =>
      adminApi.getReviews({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')), page }).then(r => r.data),
  });

  const invalidate = () => qc.invalidateQueries(['admin-reviews']);
  const approveMut = useMutation({ mutationFn: (id) => adminApi.approveReview(id), onSuccess: () => { toast.success('Review approved'); invalidate(); } });
  const rejectMut  = useMutation({ mutationFn: (id) => adminApi.rejectReview(id),  onSuccess: () => { toast.success('Review rejected'); invalidate(); } });

  const set = (key) => (e) => { setFilters(f => ({ ...f, [key]: e.target.value })); setPage(1); };

  const pending  = data?.results?.filter(r => !r.is_approved).length ?? 0;
  const approved = data?.results?.filter(r => r.is_approved).length ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Reviews" />
      <div className="p-6 flex flex-col gap-4">

        {/* Summary */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Reviews', value: data?.count ?? 0, icon: 'rate_review', color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Pending',       value: pending,          icon: 'pending',     color: 'bg-amber-50 text-amber-600'  },
              { label: 'Approved',      value: approved,         icon: 'verified',    color: 'bg-emerald-50 text-emerald-600' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-stone-100">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-black text-stone-800">{value}</p>
                  <p className="text-xs text-stone-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filters.is_approved} onChange={set('is_approved')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Reviews</option>
            <option value="true">Approved</option>
            <option value="false">Pending</option>
          </select>
          <select value={filters.rating} onChange={set('rating')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {data?.results?.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center text-stone-400">No reviews found</div>
            )}
            {data?.results?.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <StarRating rating={r.rating} />
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {r.is_approved ? 'Approved' : 'Pending'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-bold text-stone-800 text-sm">{r.title}</p>
                    <p className="text-stone-600 text-sm mt-1 line-clamp-2">{r.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">person</span>
                        {r.user_email}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">shopping_bag</span>
                        {r.product_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!r.is_approved ? (
                      <button
                        onClick={() => approveMut.mutate(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer border-0"
                      >
                        <span className="material-symbols-outlined text-sm">check</span> Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => rejectMut.mutate(r.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer border-0"
                      >
                        <span className="material-symbols-outlined text-sm">close</span> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100">
          <Pagination page={page} totalPages={data?.total_pages} count={data?.count} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
