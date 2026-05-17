import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import Topbar from '../components/Topbar';

// ── Zod schemas ────────────────────────────────────────────────────────────────
const variantSchema = z.object({
  weight:              z.coerce.number().positive('Required'),
  unit:                z.enum(['g', 'kg', 'ml']),
  price:               z.coerce.number().positive('Required'),
  mrp:                 z.coerce.number().positive('Required'),
  stock:               z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0).default(10),
  is_default:          z.boolean().default(false),
});

const productSchema = z.object({
  name:        z.string().min(2, 'Min 2 characters'),
  sku:         z.string().min(2, 'Required'),
  category:    z.coerce.number({ error: 'Select a category' }),
  description: z.string().min(5, 'Required'),
  ingredients: z.string().optional(),
  origin:      z.string().optional(),
  is_organic:  z.boolean().default(false),
  is_featured: z.boolean().default(false),
  variants:    z.array(variantSchema).min(1, 'At least one variant required'),
});

// ── Shared style helpers ───────────────────────────────────────────────────────
const inp = 'w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]';
const lbl = 'block text-xs font-semibold text-stone-600 mb-1';
const err = 'text-red-500 text-xs mt-0.5';

// ── Variant Row (inside product form) ─────────────────────────────────────────
function VariantRow({ index, register, errors, remove }) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-stone-600">Variant {index + 1}</p>
        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 cursor-pointer bg-transparent border-0 p-0">
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className={lbl}>Weight</label>
          <input {...register(`variants.${index}.weight`)} type="number" placeholder="100" className={inp} />
          {errors?.variants?.[index]?.weight && <p className={err}>{errors.variants[index].weight.message}</p>}
        </div>
        <div>
          <label className={lbl}>Unit</label>
          <select {...register(`variants.${index}.unit`)} className={inp}>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Is Default</label>
          <div className="flex items-center h-10 gap-2">
            <input {...register(`variants.${index}.is_default`)} type="checkbox" className="w-4 h-4 accent-[#ec4913]" />
            <span className="text-xs text-stone-500">Default variant</span>
          </div>
        </div>
        <div>
          <label className={lbl}>Price (₹)</label>
          <input {...register(`variants.${index}.price`)} type="number" step="0.01" placeholder="99.00" className={inp} />
          {errors?.variants?.[index]?.price && <p className={err}>{errors.variants[index].price.message}</p>}
        </div>
        <div>
          <label className={lbl}>MRP (₹)</label>
          <input {...register(`variants.${index}.mrp`)} type="number" step="0.01" placeholder="120.00" className={inp} />
          {errors?.variants?.[index]?.mrp && <p className={err}>{errors.variants[index].mrp.message}</p>}
        </div>
        <div>
          <label className={lbl}>Stock</label>
          <input {...register(`variants.${index}.stock`)} type="number" placeholder="0" className={inp} />
        </div>
      </div>
    </div>
  );
}

// ── Product Form Modal (Create / Edit) ────────────────────────────────────────
function ProductModal({ product, categories, allTags, onClose, onSaved }) {
  const isEdit = !!product;
  const qc = useQueryClient();

  // Tag selection state — initialised from existing product tags
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => (product?.tags ?? []).map((t) => t.id)
  );

  const toggleTag = (id) =>
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: isEdit
      ? {
          name:        product.name,
          sku:         product.sku,
          category:    product.category,
          description: product.description,
          ingredients: product.ingredients || '',
          origin:      product.origin || '',
          is_organic:  product.is_organic,
          is_featured: product.is_featured,
          variants:    product.variants?.length ? product.variants : [{ weight: '', unit: 'g', price: '', mrp: '', stock: 0, low_stock_threshold: 10, is_default: true }],
        }
      : { variants: [{ weight: '', unit: 'g', price: '', mrp: '', stock: 0, low_stock_threshold: 10, is_default: true }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  const onSubmit = async (values) => {
    const { variants, ...productData } = values;
    try {
      let savedProduct;
      if (isEdit) {
        const res = await adminApi.updateProduct(product.id, productData);
        savedProduct = res.data;
        const existingData = await adminApi.getVariants(product.id).then(r => r.data);
        const existing = Array.isArray(existingData) ? existingData : (existingData?.results ?? []);
        await Promise.all(existing.map(v => adminApi.deleteVariant(product.id, v.id)));
      } else {
        const res = await adminApi.createProduct(productData);
        savedProduct = res.data;
      }
      await Promise.all(variants.map(v => adminApi.createVariant(savedProduct.id, v)));
      await adminApi.setProductTags(savedProduct.id, selectedTagIds);
      toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      onSaved();
    } catch (e) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : 'Something went wrong';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-stone-800 text-lg">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Product Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Product Name *</label>
                <input {...register('name')} placeholder="Malabar Black Pepper" className={inp} />
                {errors.name && <p className={err}>{errors.name.message}</p>}
              </div>
              <div>
                <label className={lbl}>SKU *</label>
                <input {...register('sku')} placeholder="VAN-BPP-001" className={inp} />
                {errors.sku && <p className={err}>{errors.sku.message}</p>}
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select {...register('category')} className={inp}>
                  <option value="">Select category</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.category && <p className={err}>{errors.category.message}</p>}
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description *</label>
                <textarea {...register('description')} rows={3} placeholder="Product description..." className={`${inp} resize-none`} />
                {errors.description && <p className={err}>{errors.description.message}</p>}
              </div>
              <div>
                <label className={lbl}>Ingredients</label>
                <input {...register('ingredients')} placeholder="100% whole black pepper" className={inp} />
              </div>
              <div>
                <label className={lbl}>Origin</label>
                <input {...register('origin')} placeholder="Kerala, India" className={inp} />
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('is_organic')} type="checkbox" className="w-4 h-4 accent-[#ec4913]" />
                  <span className="text-sm text-stone-700">Organic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...register('is_featured')} type="checkbox" className="w-4 h-4 accent-[#ec4913]" />
                  <span className="text-sm text-stone-700">Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? 'bg-[#ec4913] text-white border-[#ec4913]'
                          : 'bg-white text-stone-500 border-stone-200 hover:border-[#ec4913]/50 hover:text-[#ec4913]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs leading-none">label</span>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              {selectedTagIds.length > 0 && (
                <p className="text-xs text-stone-400 mt-2">{selectedTagIds.length} tag{selectedTagIds.length > 1 ? 's' : ''} selected</p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Variants * {errors.variants?.root && <span className={err}>{errors.variants.root.message}</span>}
              </h3>
              <button
                type="button"
                onClick={() => append({ weight: '', unit: 'g', price: '', mrp: '', stock: 0, low_stock_threshold: 10, is_default: false })}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#ec4913]/10 text-[#ec4913] text-xs font-semibold rounded-lg hover:bg-[#ec4913] hover:text-white transition-colors cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Variant
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <VariantRow key={field.id} index={index} register={register} errors={errors} remove={remove} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] disabled:opacity-60 cursor-pointer">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Variant Manager Modal ──────────────────────────────────────────────────────
const emptyAdd = { weight: '', unit: 'g', price: '', mrp: '', stock: '' };

function VariantManagerModal({ product, onClose }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [addForm, setAddForm]     = useState(emptyAdd);

  const { data: variants, isLoading } = useQuery({
    queryKey: ['admin-variants', product.id],
    queryFn: () => adminApi.getVariants(product.id).then(r => r.data),
  });

  const variantList = Array.isArray(variants) ? variants : variants?.results || [];

  const invalidateVariants = () => qc.invalidateQueries({ queryKey: ['admin-variants', product.id] });
  const invalidateProducts = () => qc.invalidateQueries({ queryKey: ['admin-products'] });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateVariant(product.id, id, data),
    onSuccess: () => { toast.success('Variant updated'); invalidateVariants(); setEditingId(null); },
    onError: () => toast.error('Update failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteVariant(product.id, id),
    onSuccess: () => { toast.success('Variant deleted'); invalidateVariants(); invalidateProducts(); },
    onError: () => toast.error('Delete failed'),
  });

  const createMut = useMutation({
    mutationFn: (data) => adminApi.createVariant(product.id, data),
    onSuccess: () => { toast.success('Variant added'); invalidateVariants(); invalidateProducts(); setAddForm(emptyAdd); },
    onError: () => toast.error('Create failed'),
  });

  const startEdit = (v) => {
    setEditingId(v.id);
    setEditForm({ weight: v.weight, unit: v.unit, price: v.price, mrp: v.mrp, stock: v.stock, low_stock_threshold: v.low_stock_threshold });
  };

  const editField = (key) => (e) => setEditForm(f => ({ ...f, [key]: e.target.value }));
  const addField  = (key) => (e) => setAddForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-stone-800">Manage Variants</h2>
            <p className="text-xs text-stone-400">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <span className="material-symbols-outlined animate-spin text-[#ec4913] text-3xl">progress_activity</span>
            </div>
          ) : variantList.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-4">No variants yet. Add one below.</p>
          ) : (
            variantList.map(v => (
              <div key={v.id} className="border border-stone-200 rounded-xl p-4">
                {editingId === v.id ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[['weight', 'Weight', 'number'], ['price', 'Price (₹)', 'number'], ['mrp', 'MRP (₹)', 'number'], ['stock', 'Stock', 'number']].map(([key, label, type]) => (
                      <div key={key}>
                        <label className={lbl}>{label}</label>
                        <input type={type} step="0.01" value={editForm[key] ?? ''} onChange={editField(key)} className={inp} />
                      </div>
                    ))}
                    <div>
                      <label className={lbl}>Unit</label>
                      <select value={editForm.unit || 'g'} onChange={editField('unit')} className={inp}>
                        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2 col-span-3">
                      <button
                        onClick={() => updateMut.mutate({ id: v.id, data: editForm })}
                        disabled={updateMut.isPending}
                        className="flex-1 py-2 bg-[#ec4913] text-white text-xs font-semibold rounded-lg cursor-pointer border-0 disabled:opacity-60"
                      >
                        {updateMut.isPending ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2 border border-stone-200 text-xs font-semibold rounded-lg cursor-pointer bg-white">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{v.weight}{v.unit}</p>
                      <p className="text-xs text-stone-500">₹{v.price} <span className="line-through text-stone-300">₹{v.mrp}</span> · Stock: {v.stock}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.is_default && <span className="px-2 py-0.5 bg-[#ec4913]/10 text-[#ec4913] text-xs rounded-full font-semibold">Default</span>}
                      <button onClick={() => startEdit(v)} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
                        <span className="material-symbols-outlined text-stone-500 text-sm">edit</span>
                      </button>
                      <button onClick={() => { if (confirm('Delete this variant?')) deleteMut.mutate(v.id); }} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent">
                        <span className="material-symbols-outlined text-red-400 text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add new variant */}
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-4">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Add Variant</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[['weight', 'Weight', 'number'], ['price', 'Price (₹)', 'number'], ['mrp', 'MRP (₹)', 'number'], ['stock', 'Stock', 'number']].map(([key, label, type]) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <input type={type} step="0.01" value={addForm[key]} onChange={addField(key)} placeholder="0" className={inp} />
                </div>
              ))}
              <div>
                <label className={lbl}>Unit</label>
                <select value={addForm.unit} onChange={addField('unit')} className={inp}>
                  <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => createMut.mutate({ weight: addForm.weight, unit: addForm.unit, price: addForm.price, mrp: addForm.mrp, stock: addForm.stock || 0, low_stock_threshold: 10, is_default: false })}
              disabled={!addForm.weight || !addForm.price || !addForm.mrp || createMut.isPending}
              className="w-full py-2 bg-stone-800 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 disabled:opacity-40 cursor-pointer border-0"
            >
              {createMut.isPending ? 'Adding…' : 'Add Variant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image Manager Modal ────────────────────────────────────────────────────────
function ImageManagerModal({ product, onClose }) {
  const qc = useQueryClient();
  const [file, setFile]       = useState(null);
  const [altText, setAltText] = useState('');

  const { data: images, isLoading } = useQuery({
    queryKey: ['admin-images', product.id],
    queryFn: () => adminApi.getImages(product.id).then(r => r.data),
  });

  const imageList = Array.isArray(images) ? images : images?.results || [];

  const invalidateImages   = () => qc.invalidateQueries({ queryKey: ['admin-images', product.id] });
  const invalidateProducts = () => qc.invalidateQueries({ queryKey: ['admin-products'] });

  const uploadMut = useMutation({
    mutationFn: ({ file, altText }) => {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('alt_text', altText);
      return adminApi.uploadImage(product.id, fd);
    },
    onSuccess: () => { toast.success('Image uploaded'); invalidateImages(); invalidateProducts(); setFile(null); setAltText(''); },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteImage(product.id, id),
    onSuccess: () => { toast.success('Image deleted'); invalidateImages(); invalidateProducts(); },
    onError: () => toast.error('Delete failed'),
  });

  const setPrimaryMut = useMutation({
    mutationFn: (id) => adminApi.setPrimaryImage(product.id, id),
    onSuccess: () => { toast.success('Set as primary'); invalidateImages(); invalidateProducts(); },
    onError: () => toast.error('Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-bold text-stone-800">Manage Images</h2>
            <p className="text-xs text-stone-400">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg cursor-pointer border-0 bg-transparent">
            <span className="material-symbols-outlined text-stone-500">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <span className="material-symbols-outlined animate-spin text-[#ec4913] text-3xl">progress_activity</span>
            </div>
          ) : imageList.length === 0 ? (
            <div className="text-center py-8 text-stone-300">
              <span className="material-symbols-outlined text-5xl mb-2 block">image</span>
              <p className="text-sm text-stone-400">No images yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {imageList.map(img => (
                <div key={img.id} className="border border-stone-200 rounded-xl overflow-hidden">
                  <div className="relative">
                    <img src={img.image_url} alt={img.alt_text || product.name} className="w-full h-32 object-cover" />
                    {img.is_primary && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#ec4913] text-white text-xs rounded-full font-semibold">Primary</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-stone-500 truncate mb-2">{img.alt_text || '—'}</p>
                    <div className="flex gap-1.5">
                      {!img.is_primary && (
                        <button
                          onClick={() => setPrimaryMut.mutate(img.id)}
                          disabled={setPrimaryMut.isPending}
                          className="flex-1 py-1 text-xs border border-stone-200 rounded-lg font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white disabled:opacity-50"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm('Delete this image?')) deleteMut.mutate(img.id); }}
                        disabled={deleteMut.isPending}
                        className="py-1 px-2 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 cursor-pointer border-0 font-semibold disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload section */}
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-4">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Upload Image</p>
            <div className="flex flex-col gap-2">
              <input
                key={file?.name}
                type="file"
                accept="image/*"
                onChange={e => setFile(e.target.files[0] || null)}
                className="text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ec4913]/10 file:text-[#ec4913] hover:file:bg-[#ec4913]/20 cursor-pointer"
              />
              {file && <p className="text-xs text-stone-500">Selected: {file.name}</p>}
              <input
                type="text"
                placeholder="Alt text (optional)"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                className={inp}
              />
              <button
                onClick={() => file && uploadMut.mutate({ file, altText })}
                disabled={!file || uploadMut.isPending}
                className="py-2 bg-stone-800 text-white text-xs font-semibold rounded-lg hover:bg-stone-700 disabled:opacity-40 cursor-pointer border-0"
              >
                {uploadMut.isPending ? 'Uploading…' : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteConfirmModal({ product, onConfirm, onClose, isPending }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
          </div>
          <div>
            <h2 className="font-bold text-stone-800 text-lg mb-1">Delete Product?</h2>
            <p className="text-sm text-stone-500">
              Are you sure you want to delete <span className="font-semibold text-stone-700">"{product.name}"</span>? This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full pt-1">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer bg-white disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60 cursor-pointer border-0"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [filters, setFilters]           = useState({ search: '', is_featured: '', is_organic: '' });
  const [modal, setModal]               = useState(null);
  const [variantTarget, setVariantTarget] = useState(null);
  const [imageTarget, setImageTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: () =>
      adminApi.getProducts(Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))).then(r => r.data),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then(r => r.data),
  });
  const categories = categoriesRes?.results || categoriesRes || [];

  const { data: tagsRes } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: () => adminApi.getTags().then(r => r.data),
  });
  const allTags = tagsRes?.results ?? tagsRes ?? [];

  const deleteMut = useMutation({
    mutationFn: (id) => adminApi.deleteProduct(id),
    onSuccess: () => { toast.success('Product deleted'); setDeleteTarget(null); qc.invalidateQueries({ queryKey: ['admin-products'] }); },
    onError: () => toast.error('Cannot delete — product may be linked to orders'),
  });

  const featuredMut = useMutation({
    mutationFn: (id) => adminApi.toggleFeatured(id),
    onSuccess: (res) => {
      toast.success(res.data.is_featured ? 'Marked as featured' : 'Removed from featured');
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const openEdit = async (id) => {
    try {
      const res = await adminApi.getProduct(id);
      setModal(res.data);
    } catch { toast.error('Failed to load product'); }
  };

  const set = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="flex flex-col min-h-screen bg-stone-100">
      <Topbar title="Products" />
      <div className="p-6 flex flex-col gap-4">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-lg">search</span>
              <input
                placeholder="Search name or SKU..."
                value={filters.search} onChange={set('search')}
                className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 w-52"
              />
            </div>
            <select value={filters.is_featured} onChange={set('is_featured')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
              <option value="">All Products</option>
              <option value="true">Featured</option>
              <option value="false">Not Featured</option>
            </select>
            <select value={filters.is_organic} onChange={set('is_organic')} className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 cursor-pointer">
              <option value="">All Types</option>
              <option value="true">Organic</option>
              <option value="false">Non-Organic</option>
            </select>
          </div>
          <button
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#ec4913] text-white rounded-xl text-sm font-semibold hover:bg-[#d43d0f] transition-colors cursor-pointer border-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Product
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
                    {['Product', 'Category', 'Price', 'Variants', 'Rating', 'Tags', 'Featured', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {data?.results?.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-stone-400">No products found</td></tr>
                  )}
                  {data?.results?.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      {/* Product column with thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.primary_image ? (
                            <img
                              src={p.primary_image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-stone-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-stone-400 text-base">image</span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-stone-800 text-sm max-w-[140px] truncate">{p.name}</p>
                            <p className="text-xs text-stone-400 font-mono">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{p.category_name}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#ec4913]">{p.min_price ? `₹${p.min_price}` : '—'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setVariantTarget(p)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-colors cursor-pointer border-0"
                        >
                          <span className="material-symbols-outlined text-xs">inventory_2</span>
                          {p.variant_count}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-sm font-semibold text-stone-700">{Number(p.avg_rating).toFixed(1)}</span>
                          <span className="text-xs text-stone-400">({p.review_count})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(p.tags ?? []).slice(0, 3).map(tag => (
                            <span key={tag.id} className="px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full font-medium whitespace-nowrap">
                              {tag.name}
                            </span>
                          ))}
                          {(p.tags ?? []).length > 3 && (
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-400 text-xs rounded-full font-medium">
                              +{p.tags.length - 3}
                            </span>
                          )}
                          {(p.tags ?? []).length === 0 && <span className="text-xs text-stone-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => featuredMut.mutate(p.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer border-0 ${p.is_featured ? 'bg-[#ec4913]/10 text-[#ec4913] hover:bg-[#ec4913]/20' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                        >
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: p.is_featured ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                          {p.is_featured ? 'Featured' : 'Normal'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(p.id)} className="p-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer border-0 bg-transparent group" title="Edit product">
                            <span className="material-symbols-outlined text-stone-400 group-hover:text-indigo-600 text-sm">edit</span>
                          </button>
                          <button onClick={() => setImageTarget(p)} className="p-1.5 hover:bg-amber-50 rounded-lg cursor-pointer border-0 bg-transparent group" title="Manage images">
                            <span className="material-symbols-outlined text-stone-400 group-hover:text-amber-600 text-sm">photo_library</span>
                          </button>
                          <button onClick={() => setVariantTarget(p)} className="p-1.5 hover:bg-violet-50 rounded-lg cursor-pointer border-0 bg-transparent group" title="Manage variants">
                            <span className="material-symbols-outlined text-stone-400 group-hover:text-violet-600 text-sm">tune</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer border-0 bg-transparent group"
                            title="Delete product"
                          >
                            <span className="material-symbols-outlined text-stone-400 group-hover:text-red-500 text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data?.count > 0 && (
              <div className="px-4 py-3 border-t border-stone-100 text-xs text-stone-400">
                Showing {data.results?.length} of {data.count} products
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          categories={categories}
          allTags={allTags}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}

      {variantTarget && (
        <VariantManagerModal product={variantTarget} onClose={() => setVariantTarget(null)} />
      )}

      {imageTarget && (
        <ImageManagerModal product={imageTarget} onClose={() => setImageTarget(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isPending={deleteMut.isPending}
        />
      )}
    </div>
  );
}
