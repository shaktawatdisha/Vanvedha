function getPageList(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }

  const pages = [1];
  if (range[0] > 2) pages.push('…');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('…');
  if (total > 1) pages.push(total);
  return pages;
}

const btnBase = 'h-8 min-w-8 px-2 rounded-lg text-xs font-semibold cursor-pointer border-0 transition-colors flex items-center justify-center';

export default function Pagination({ page, totalPages, count, pageSize = 20, onPageChange }) {
  if (!count || !totalPages || totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 flex-wrap gap-2">
      <p className="text-xs text-stone-400">
        Showing <span className="font-semibold text-stone-600">{from}–{to}</span> of{' '}
        <span className="font-semibold text-stone-600">{count}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={`${btnBase} bg-stone-100 text-stone-500 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>
        {getPageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-1 text-stone-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${p === page ? 'bg-[#ec4913] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={`${btnBase} bg-stone-100 text-stone-500 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
