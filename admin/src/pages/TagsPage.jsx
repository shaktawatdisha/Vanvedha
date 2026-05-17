import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

const inp = 'w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]';
const lbl = 'block text-xs font-semibold text-stone-600 mb-1';
const err = 'text-red-500 text-xs mt-0.5';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  slug: z.string().optional(),
});

// ── Tag Modal (Create / Edit) ──────────────────────────────────────────────────
function TagModal({ tag, onClose }) {
  const isEdit = !!tag;
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tag?.name ?? '',
      slug: tag?.slug ?? '',
    },
  });

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      ...(values.slug ? { slug: values.slug } : {}),
    };
    try {
      if (isEdit) {
        await adminApi.updateTag(tag.id, payload);
      } else {
        await adminApi.createTag(payload);
      }
      toast.success(isEdit ? 'Tag updated' : 'Tag created');
      qc.invalidateQueries({ queryKey: ['admin-tags'] });
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Something went wrong');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-bold text-stone-800 text-lg">{isEdit ? 'Edit Tag' : 'Add New Tag'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className={lbl}>Name *</label>
            <input {...register('name')} placeholder="e.g. Smoky, Organic, Hot…" className={inp} />
            {errors.name && <p className={err}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={lbl}>Slug <span className="text-stone-400 font-normal">(auto-generated if blank)</span></label>
            <input {...register('slug')} placeholder="e.g. smoky" className={inp} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer border-0">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TagsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(null); // null | 'create' | tag object

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', search],
    queryFn:  () => adminApi.getTags(search ? { search } : {}).then((r) => r.data),
  });

  const tags = Array.isArray(data) ? data : (data?.results ?? []);

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteTag(id),
    onSuccess:  () => { toast.success('Tag deleted'); qc.invalidateQueries({ queryKey: ['admin-tags'] }); },
    onError:    (e) => toast.error(e.response?.data?.detail || 'Cannot delete tag'),
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Tags" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
            <input
              placeholder="Search tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-52"
            />
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] transition-colors cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Tag
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <span className="material-symbols-outlined animate-spin text-[#ec4913] text-4xl">progress_activity</span>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    {['Name', 'Slug', 'Products', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {tags.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-stone-400">
                        <span className="material-symbols-outlined text-3xl block mb-2">label_off</span>
                        {search ? 'No tags match your search.' : 'No tags yet. Add one to get started.'}
                      </td>
                    </tr>
                  ) : (
                    tags.map((tag) => (
                      <tr key={tag.id} className="hover:bg-stone-50 transition-colors">
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#ec4913] text-base">label</span>
                            <span className="font-semibold text-stone-800 text-sm">{tag.name}</span>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-4 py-3 text-xs text-stone-400 font-mono">{tag.slug}</td>

                        {/* Product count */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                            tag.product_count > 0
                              ? 'bg-[#ec4913]/10 text-[#ec4913]'
                              : 'bg-stone-100 text-stone-400'
                          }`}>
                            <span className="material-symbols-outlined text-xs">inventory_2</span>
                            {tag.product_count} {tag.product_count === 1 ? 'product' : 'products'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal(tag)}
                              className="p-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer border-0 bg-transparent group"
                              title="Edit tag"
                            >
                              <span className="material-symbols-outlined text-stone-400 group-hover:text-indigo-600 text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete tag "${tag.name}"? This will remove it from all products.`))
                                  deleteMut.mutate(tag.id);
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent group"
                              title="Delete tag"
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
            {tags.length > 0 && (
              <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400">
                Showing {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modal && (
        <TagModal
          tag={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
