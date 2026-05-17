import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin';
import AdminTopbar from '../../components/layout/AdminTopbar';

const inputCls = 'border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 bg-white';
const thCls    = 'px-5 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider';
const tdCls    = 'px-5 py-3 text-sm text-stone-700 align-middle';

export default function AdminTags() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState('');
  const [editTag,  setEditTag]  = useState(null);   // tag being edited { id, name, slug }
  const [editName, setEditName] = useState('');
  const [newName,  setNewName]  = useState('');
  const [deleting, setDeleting] = useState(null);

  /* ── Queries & mutations ── */
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', search],
    queryFn:  () => adminApi.getTags(search ? { search } : {}).then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (name) => adminApi.createTag({ name }),
    onSuccess: () => {
      toast.success('Tag created');
      setNewName('');
      qc.invalidateQueries(['admin-tags']);
    },
    onError: () => toast.error('Failed to create tag'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name }) => adminApi.updateTag(id, { name }),
    onSuccess: () => {
      toast.success('Tag updated');
      setEditTag(null);
      qc.invalidateQueries(['admin-tags']);
    },
    onError: () => toast.error('Failed to update tag'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteTag(id),
    onSuccess: () => {
      toast.success('Tag deleted');
      setDeleting(null);
      qc.invalidateQueries(['admin-tags']);
    },
    onError: () => toast.error('Failed to delete tag'),
  });

  const tags = data?.results ?? data ?? [];

  /* ── Handlers ── */
  const handleCreate = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    createMut.mutate(name);
  };

  const startEdit = (tag) => {
    setEditTag(tag);
    setEditName(tag.name);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const name = editName.trim();
    if (!name || name === editTag.name) { setEditTag(null); return; }
    updateMut.mutate({ id: editTag.id, name });
  };

  return (
    <div className="flex flex-col">
      <AdminTopbar title="Tags" />

      <div className="p-6 flex flex-col gap-6">

        {/* ── Add new tag ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-base font-bold text-stone-800 mb-4">Add New Tag</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              className={`${inputCls} flex-1`}
              placeholder="Tag name (e.g. Smoky, Organic, Hot…)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newName.trim() || createMut.isPending}
              className="flex items-center gap-2 bg-[#ec4913] text-white rounded-xl px-5 py-2 text-sm font-bold hover:bg-[#ec4913]/90 disabled:opacity-50 cursor-pointer border-0 transition-colors"
            >
              <span className="material-symbols-outlined text-base leading-none">add</span>
              {createMut.isPending ? 'Adding…' : 'Add Tag'}
            </button>
          </form>
          <p className="mt-2 text-xs text-stone-400">The slug is auto-generated from the name.</p>
        </div>

        {/* ── Tag list ── */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 flex-1 max-w-sm">
              <span className="material-symbols-outlined text-stone-400 text-lg">search</span>
              <input
                className="bg-transparent py-2 text-sm outline-none w-full placeholder:text-stone-400"
                placeholder="Search tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="border-0 bg-transparent cursor-pointer text-stone-400 hover:text-stone-700">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
            <span className="text-xs text-stone-400 ml-auto">
              {isLoading ? '…' : `${tags.length} tag${tags.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-stone-400 gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading…
            </div>
          ) : tags.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-stone-400 gap-2">
              <span className="material-symbols-outlined text-4xl">label_off</span>
              <p className="text-sm">{search ? 'No tags match your search.' : 'No tags yet. Add one above.'}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className={thCls}>Name</th>
                  <th className={thCls}>Slug</th>
                  <th className={`${thCls} text-center`}>Products</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-stone-50 transition-colors">
                    {/* Name — inline edit */}
                    <td className={tdCls}>
                      {editTag?.id === tag.id ? (
                        <form onSubmit={handleUpdate} className="flex gap-2 items-center">
                          <input
                            autoFocus
                            className={`${inputCls} py-1`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <button
                            type="submit"
                            disabled={updateMut.isPending}
                            className="text-xs font-bold text-green-600 hover:text-green-700 border-0 bg-transparent cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditTag(null)}
                            className="text-xs font-bold text-stone-400 hover:text-stone-600 border-0 bg-transparent cursor-pointer"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <span className="font-medium text-stone-800">{tag.name}</span>
                      )}
                    </td>

                    {/* Slug */}
                    <td className={tdCls}>
                      <code className="text-xs bg-stone-100 text-stone-500 rounded px-2 py-0.5">{tag.slug}</code>
                    </td>

                    {/* Product count */}
                    <td className={`${tdCls} text-center`}>
                      <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${
                        tag.product_count > 0
                          ? 'bg-[#ec4913]/10 text-[#ec4913]'
                          : 'bg-stone-100 text-stone-400'
                      }`}>
                        {tag.product_count}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={`${tdCls} text-right`}>
                      {deleting === tag.id ? (
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs text-stone-500">Delete tag?</span>
                          <button
                            onClick={() => deleteMut.mutate(tag.id)}
                            disabled={deleteMut.isPending}
                            className="text-xs font-bold text-red-600 hover:text-red-700 border-0 bg-transparent cursor-pointer disabled:opacity-50"
                          >
                            {deleteMut.isPending ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleting(null)}
                            className="text-xs font-bold text-stone-400 hover:text-stone-600 border-0 bg-transparent cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(tag)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-100 border-0 bg-transparent cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm leading-none">edit</span>
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleting(tag.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 border-0 bg-transparent cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm leading-none">delete</span>
                            Delete
                          </button>
                        </div>
                      )}
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
