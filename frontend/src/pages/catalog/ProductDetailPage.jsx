import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { catalogApi } from '../../api/catalog';
import { cartApi }    from '../../api/cart';
import { reviewsApi } from '../../api/reviews';

/* ─── Star row ─── */
function Stars({ value, max = 5, size = 'text-xl' }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5 text-[#ec4913]">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`material-symbols-outlined ${size}`}
          style={{ fontVariationSettings: i < filled ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

/* ─── Accordion item ─── */
function Accordion({ icon, label, open, onToggle, children }) {
  return (
    <div className="py-5 border-b border-slate-200">
      <button onClick={onToggle} className="flex items-center justify-between w-full group cursor-pointer border-0 bg-transparent w-full text-left">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#ec4913]">{icon}</span>
          <span className="text-lg font-bold">{label}</span>
        </div>
        <span className="material-symbols-outlined text-slate-400 group-hover:text-[#ec4913] transition-colors">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ─── Review card ─── */
function ReviewCard({ review }) {
  const name     = [review.user?.first_name, review.user?.last_name].filter(Boolean).join(' ') || 'Customer';
  const initials = [review.user?.first_name?.[0], review.user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  const date     = new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <Stars value={review.rating} size="text-sm" />
      <p className="font-bold text-base mt-3 mb-1">{review.title}</p>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">"{review.body}"</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#ec4913]/20 flex items-center justify-center text-[#ec4913] font-bold text-xs">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold">{name}</p>
            <p className="text-xs text-slate-400">Verified Buyer</p>
          </div>
        </div>
        <span className="text-xs text-slate-400">{date}</span>
      </div>
    </div>
  );
}

/* ─── Write review form ─── */
function ReviewForm({ slug, onSuccess }) {
  const [form, setForm]     = useState({ rating: 5, title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error('Please fill in all fields');
    setSaving(true);
    try {
      await reviewsApi.createReview(slug, form);
      toast.success('Review submitted for approval');
      setForm({ rating: 5, title: '', body: '' });
      onSuccess();
    } catch {
      toast.error('Failed to submit review. Please log in first.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 bg-[#ec4913]/5 p-6 rounded-2xl">
      <p className="font-bold text-base">Write a Review</p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Your rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setForm((f) => ({ ...f, rating: n }))}
            className="border-0 bg-transparent cursor-pointer p-0 leading-none"
          >
            <span
              className="material-symbols-outlined text-[#ec4913] text-xl"
              style={{ fontVariationSettings: n <= form.rating ? "'FILL' 1" : "'FILL' 0" }}
            >
              star
            </span>
          </button>
        ))}
      </div>
      <input
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913]"
        placeholder="Review title"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
      />
      <textarea
        rows={3}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#ec4913] resize-none"
        placeholder="Share your experience…"
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
      />
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-xl bg-[#ec4913] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#ec4913]/90 disabled:opacity-60 cursor-pointer border-0"
      >
        {saving ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}

/* ─── Page skeleton ─── */
function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="aspect-square bg-slate-200 rounded-xl" />
        <div className="flex flex-col gap-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-4 bg-slate-100 rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function ProductDetailPage() {
  const { slug }     = useParams();
  const navigate     = useNavigate();

  const [product,     setProduct]     = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [activeImg,   setActiveImg]   = useState(null);
  const [selVariant,  setSelVariant]  = useState(null);
  const [qty,         setQty]         = useState(1);
  const [addingCart,  setAddingCart]  = useState(false);
  const [openTab,     setOpenTab]     = useState('description');

  const loadReviews = () =>
    reviewsApi.getProductReviews(slug)
      .then((res) => setReviews(res.data?.results ?? res.data ?? []))
      .catch(() => {});

  useEffect(() => {
    setLoading(true);
    catalogApi.getProduct(slug)
      .then((res) => {
        const p = res.data;
        setProduct(p);
        const primary = p.images?.find((i) => i.is_primary) ?? p.images?.[0] ?? null;
        setActiveImg(primary);
        const def = p.variants?.find((v) => v.is_default) ?? p.variants?.[0] ?? null;
        setSelVariant(def);
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));

    loadReviews();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selVariant) return;
    setAddingCart(true);
    try {
      await cartApi.addItem({ variant_id: selVariant.id, quantity: qty });
      toast.success('Added to cart');
    } catch {
      toast.error('Failed to add to cart. Please log in first.');
    } finally {
      setAddingCart(false);
    }
  };

  if (loading) return <div className="bg-[#f8f6f6] min-h-screen font-display"><PageSkeleton /></div>;
  if (!product) return null;

  const allImages   = product.images ?? [];
  const otherImages = allImages.filter((i) => i.id !== activeImg?.id);

  const hasDiscount = selVariant && Number(selVariant.mrp) > Number(selVariant.price);

  return (
    <div className="bg-[#f8f6f6] font-display antialiased">
      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8 flex-wrap">
          <Link to="/" className="hover:text-[#ec4913]">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link to="/products" className="hover:text-[#ec4913]">All Spices</Link>
          {product.category && (
            <>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="hover:text-[#ec4913] cursor-default">{product.category.name}</span>
            </>
          )}
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* ── Image Gallery ── */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-white shadow-sm group">
              {activeImg ? (
                <img
                  src={activeImg.image}
                  alt={activeImg.alt_text || product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-8xl text-slate-200">herbs</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_organic && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">Organic</span>
                )}
                {product.is_featured && (
                  <span className="bg-[#ec4913] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">Featured</span>
                )}
              </div>
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {allImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(img)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      activeImg?.id === img.id ? 'border-[#ec4913]' : 'border-transparent hover:border-[#ec4913]/40'
                    }`}
                  >
                    <img src={img.image} alt={img.alt_text || product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="flex flex-col">
            {product.origin && (
              <span className="text-[#ec4913] font-bold text-sm tracking-widest uppercase mb-2">{product.origin}</span>
            )}
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 leading-tight">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Stars value={product.avg_rating} />
                <span className="text-sm font-semibold text-slate-500">
                  {Number(product.avg_rating).toFixed(1)} ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              {product.sku && (
                <>
                  <div className="h-4 w-px bg-slate-300" />
                  <span className="text-xs text-slate-400 font-medium">SKU: {product.sku}</span>
                </>
              )}
            </div>

            {/* Price */}
            {selVariant && (
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-black text-slate-900">₹{selVariant.price}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-slate-400 line-through">₹{selVariant.mrp}</span>
                    <span className="text-sm font-bold text-green-600">{selVariant.discount_percent}% off</span>
                  </>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-base text-slate-600 mb-6 leading-relaxed">{product.description}</p>

            {/* Tags / Flavor profile */}
            {product.tags?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <Link key={t.slug} to={`/products?tag=${t.slug}`} className="px-3 py-1.5 bg-[#ec4913]/10 text-[#ec4913] border border-[#ec4913]/20 rounded-lg text-sm font-bold hover:bg-[#ec4913] hover:text-white transition-colors no-underline">
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Variant selector */}
            {product.variants?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Size</h4>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelVariant(v)}
                      disabled={!v.is_in_stock}
                      className={`rounded-lg px-4 py-2 text-sm font-bold border-2 transition-all cursor-pointer
                        ${selVariant?.id === v.id
                          ? 'border-[#ec4913] bg-[#ec4913] text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-[#ec4913]/50'}
                        ${!v.is_in_stock ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {v.weight}{v.unit}
                      {!v.is_in_stock && <span className="ml-1 text-[10px]">(OOS)</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 min-w-[140px]">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="hover:text-[#ec4913] transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-lg font-bold w-8 text-center">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="hover:text-[#ec4913] transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={addingCart || !selVariant || !selVariant.is_in_stock}
                className="flex-1 bg-[#ec4913] hover:bg-[#ec4913]/90 text-white font-bold py-4 px-8 rounded-lg shadow-lg shadow-[#ec4913]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0"
              >
                <span className="material-symbols-outlined">shopping_bag</span>
                {addingCart ? 'Adding…' : selVariant?.is_in_stock === false ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            {/* Accordion tabs */}
            <div className="border-t border-slate-200">
              {product.description && (
                <Accordion icon="description" label="Description" open={openTab === 'description'} onToggle={() => setOpenTab(openTab === 'description' ? '' : 'description')}>
                  <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                </Accordion>
              )}

              {product.ingredients && (
                <Accordion icon="nutrition" label="Ingredients" open={openTab === 'ingredients'} onToggle={() => setOpenTab(openTab === 'ingredients' ? '' : 'ingredients')}>
                  <p className="text-slate-600 text-sm leading-relaxed">{product.ingredients}</p>
                </Accordion>
              )}

              {product.origin && (
                <Accordion icon="location_on" label={`Origin: ${product.origin}`} open={openTab === 'origin'} onToggle={() => setOpenTab(openTab === 'origin' ? '' : 'origin')}>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    This product is sourced from <strong>{product.origin}</strong>.
                  </p>
                </Accordion>
              )}

              <Accordion
                icon="rate_review"
                label={`Customer Reviews (${product.review_count})`}
                open={openTab === 'reviews'}
                onToggle={() => setOpenTab(openTab === 'reviews' ? '' : 'reviews')}
              >
                {reviews.length === 0 ? (
                  <p className="text-slate-400 text-sm">No reviews yet. Be the first!</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                  </div>
                )}
                <ReviewForm slug={slug} onSuccess={loadReviews} />
              </Accordion>
            </div>
          </div>
        </div>

        {/* ── All Reviews section ── */}
        {reviews.length > 0 && (
          <section className="mt-24">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black mb-1">Customer Reviews</h2>
                <div className="flex items-center gap-3">
                  <Stars value={product.avg_rating} size="text-lg" />
                  <span className="text-slate-500 font-medium">{Number(product.avg_rating).toFixed(1)} out of 5 · {product.review_count} {product.review_count === 1 ? 'review' : 'reviews'}</span>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#ec4913] rounded-lg text-white">
                  <span className="material-symbols-outlined text-2xl">eco</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">Vanvedha</h2>
              </div>
              <p className="text-sm leading-relaxed">Bringing the world's finest, ethically sourced ingredients to your kitchen.</p>
            </div>
            {[
              { title: 'Shop',    links: ['All Spices', 'Gift Sets', 'Subscriptions', 'Wholesale'] },
              { title: 'Company', links: ['Our Story', 'Sustainability', 'Careers', 'Journal'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-white font-bold mb-4">{title}</h4>
                <ul className="space-y-3 text-sm">
                  {links.map((l) => <li key={l}><a href="#" className="hover:text-[#ec4913] transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© 2024 Vanvedha. All rights reserved.</p>
            <div className="flex gap-6">
              {['Privacy Policy', 'Terms of Service', 'Shipping Info'].map((l) => (
                <a key={l} href="#" className="hover:text-[#ec4913]">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
