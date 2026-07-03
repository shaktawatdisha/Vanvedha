import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';
import Pagination from '../components/Pagination';

// ── Shared style helpers (same as ProductsPage) ────────────────────────────────
const inp = 'w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]';
const lbl = 'block text-xs font-semibold text-stone-600 mb-1';
const err = 'text-red-500 text-xs mt-0.5';

// ── Zod schema ─────────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Name is required'),
  slug:        z.string().optional(),
  description: z.string().optional(),
  parent:      z.coerce.number().nullable().optional(),
});

// ── Category Modal (Create / Edit) ─────────────────────────────────────────────
function CategoryModal({ category, categories, onClose }) {
  const isEdit = !!category;
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:        category?.name        ?? '',
      slug:        category?.slug        ?? '',
      description: category?.description ?? '',
      parent:      category?.parent      ?? '',
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      name:        values.name,
      description: values.description || '',
      parent:      values.parent || null,
      ...(values.slug ? { slug: values.slug } : {}),
    };
    try {
      if (isEdit) {
        await adminApi.updateCategory(category.id, payload);
      } else {
        await adminApi.createCategory(payload);
      }
      toast.success(isEdit ? 'Category updated' : 'Category created');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Something went wrong');
    }
  };

  // Exclude self from parent dropdown when editing
  const parentOptions = categories.filter((c) => !isEdit || c.id !== category.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-stone-800 text-lg">{isEdit ? 'Edit Category' : 'Add New Category'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Category Info</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className={lbl}>Name *</label>
                <input {...register('name')} placeholder="e.g. Spices" className={inp} />
                {errors.name && <p className={err}>{errors.name.message}</p>}
              </div>
              <div>
                <label className={lbl}>Slug <span className="text-stone-400 font-normal">(auto-generated if blank)</span></label>
                <input {...register('slug')} placeholder="e.g. spices" className={inp} />
              </div>
              <div>
                <label className={lbl}>Parent Category</label>
                <select {...register('parent')} className={inp}>
                  <option value="">— None (top-level) —</option>
                  {parentOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea {...register('description')} rows={3} placeholder="Optional description…" className={`${inp} resize-none`} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);
  const [modal, setModal]   = useState(null); // null | 'create' | category object

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', search, page],
    queryFn:  () => adminApi.getCategories({ ...(search ? { search } : {}), page }).then((r) => r.data),
  });

  const categories = Array.isArray(data) ? data : (data?.results ?? []);

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Cannot delete — category may have products.'),
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Categories" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input
              placeholder="Search categories…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-52"
            />
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] transition-colors cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Category
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
                    {['Name', 'Slug', 'Parent', 'Products', 'Sub-categories', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {categories.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-stone-400">No categories found</td></tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-stone-800 text-sm">{cat.name}</td>
                        <td className="px-4 py-3 text-xs text-stone-400 font-mono">{cat.slug}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {cat.parent_name ? (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-stone-300 text-base">subdirectory_arrow_right</span>
                              {cat.parent_name}
                            </span>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg">
                            <span className="material-symbols-outlined text-xs">inventory_2</span>
                            {cat.product_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg">
                            <span className="material-symbols-outlined text-xs">account_tree</span>
                            {cat.child_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal(cat)}
                              className="p-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer border-0 bg-transparent group"
                              title="Edit category"
                            >
                              <span className="material-symbols-outlined text-stone-400 group-hover:text-indigo-600 text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => { if (confirm(`Delete "${cat.name}"? This cannot be undone.`)) deleteMut.mutate(cat.id); }}
                              className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent group"
                              title="Delete category"
                            >
                              <span className="material-symbols-outlined text-stone-400 group-hover:text-red-500 text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data?.total_pages} count={data?.count} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <CategoryModal
          category={modal === 'create' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
