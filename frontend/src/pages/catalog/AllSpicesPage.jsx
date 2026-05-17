import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalogApi } from '../../api/catalog';

const SORT_OPTIONS = [
  { label: 'Newest',             value: '-created_at'    },
  { label: 'Popularity',         value: '-avg_rating'    },
  { label: 'Price: Low to High', value: 'variants__price' },
  { label: 'Price: High to Low', value: '-variants__price'},
];

function StarRating({ value }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="material-symbols-outlined text-[#ec4913] text-xs"
          style={{ fontVariationSettings: i < filled ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function FilterSection({ title, options, selected, onToggle }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-sm uppercase tracking-wider text-slate-500 py-2">{title}</p>
      <div className="flex flex-col gap-2 mt-1">
        {options.map((opt) => (
          <label key={opt.slug} className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt.slug)}
              onChange={() => onToggle(opt.slug)}
              className="h-4 w-4 rounded border-slate-300 accent-[#ec4913]"
            />
            <span className="text-sm text-slate-700 group-hover:text-[#ec4913] transition-colors">{opt.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden border border-slate-100">
      <div className="aspect-square bg-slate-200" />
      <div className="p-5 flex flex-col gap-2">
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-5 bg-slate-200 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

export default function AllSpicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state — initialised from URL params
  const [search,     setSearch]     = useState(searchParams.get('search') || '');
  const [sort,       setSort]       = useState(searchParams.get('ordering') || '-created_at');
  const [selCats,    setSelCats]    = useState(() => searchParams.getAll('category'));
  const [selTags,    setSelTags]    = useState(() => searchParams.getAll('tag'));
  const [isOrganic,  setIsOrganic]  = useState(searchParams.get('is_organic') === 'true');
  const [inStock,    setInStock]    = useState(searchParams.get('in_stock') === 'true');

  // Data
  const [products,   setProducts]   = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(12);
  const [loading,    setLoading]    = useState(true);

  const [categories, setCategories] = useState([]);
  const [tags,       setTags]       = useState([]);

  // Load categories and tags once
  useEffect(() => {
    catalogApi.getCategories()
      .then((res) => {
        const list = res.data?.results ?? res.data ?? [];
        // flatten tree to get all leaf/top-level categories
        const flat = [];
        const walk = (nodes) => nodes.forEach((n) => { flat.push(n); if (n.children?.length) walk(n.children); });
        walk(list);
        setCategories(flat);
      })
      .catch(() => {});

    catalogApi.getTags()
      .then((res) => setTags(res.data?.results ?? res.data ?? []))
      .catch(() => {});
  }, []);

  // Build query params and fetch products whenever filters change
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = { ordering: sort, page };
    if (search)    params.search     = search;
    if (isOrganic) params.is_organic = true;
    if (inStock)   params.in_stock   = true;
    // Backend accepts single values; send the first selected for now
    if (selCats.length) params.category = selCats[0];
    if (selTags.length) params.tag      = selTags[0];

    catalogApi.getProducts(params)
      .then((res) => {
        const data = res.data;
        if (data?.results !== undefined) {
          setProducts(data.results);
          setTotalCount(data.count);
          if (data.results.length && page === 1) setPageSize(data.results.length);
        } else {
          setProducts(data ?? []);
          setTotalCount((data ?? []).length);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [search, sort, selCats, selTags, isOrganic, inStock, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Sync filters → URL
  useEffect(() => {
    const p = {};
    if (search)    p.search    = search;
    if (sort !== '-created_at') p.ordering = sort;
    selCats.forEach((c) => { p.category = c; });
    selTags.forEach((t) => { p.tag = t; });
    if (isOrganic) p.is_organic = 'true';
    if (inStock)   p.in_stock   = 'true';
    setSearchParams(p, { replace: true });
  }, [search, sort, selCats, selTags, isOrganic, inStock]);

  const toggleCat = (slug) => {
    setPage(1);
    setSelCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const toggleTag = (slug) => {
    setPage(1);
    setSelTags((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  };

  const clearAll = () => {
    setSelCats([]); setSelTags([]); setIsOrganic(false); setInStock(false); setSearch(''); setPage(1);
  };

  const activeFilterCount = selCats.length + selTags.length + (isOrganic ? 1 : 0) + (inStock ? 1 : 0);
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

  return (
    <div className="bg-white min-h-screen font-display">
      <main className="flex flex-col md:flex-row max-w-[1440px] mx-auto w-full px-4 lg:px-10 py-8 gap-10">

        {/* ── Sidebar Filters ── */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ec4913]">filter_list</span>
              <h3 className="text-lg font-bold">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="text-xs font-bold bg-[#ec4913] text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs text-[#ec4913] font-bold hover:underline border-0 bg-transparent cursor-pointer">
                Clear all
              </button>
            )}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <FilterSection
              title="Category"
              options={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              selected={selCats}
              onToggle={toggleCat}
            />
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <FilterSection
              title="Tags"
              options={tags.map((t) => ({ slug: t.slug, name: t.name }))}
              selected={selTags}
              onToggle={toggleTag}
            />
          )}

          {/* Booleans */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isOrganic}
                onChange={(e) => { setIsOrganic(e.target.checked); setPage(1); }}
                className="h-4 w-4 rounded border-slate-300 accent-[#ec4913]"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#ec4913] transition-colors">Organic only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                className="h-4 w-4 rounded border-slate-300 accent-[#ec4913]"
              />
              <span className="text-sm text-slate-700 group-hover:text-[#ec4913] transition-colors">In stock only</span>
            </label>
          </div>
        </aside>

        {/* ── Main Grid ── */}
        <section className="flex-1">
          {/* Breadcrumb & Toolbar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <nav className="flex text-xs font-medium text-slate-400 gap-2 mb-2">
                <Link to="/" className="hover:text-[#ec4913]">Home</Link>
                <span>/</span>
                <span className="text-slate-900">Shop All Spices</span>
              </nav>
              <h1 className="text-3xl font-extrabold text-slate-900">
                Our Collection
                {!loading && (
                  <span className="text-slate-400 text-lg font-normal ml-2">({totalCount} Products)</span>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="flex items-center rounded-lg bg-slate-100 px-3 gap-2">
                <span className="material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  className="bg-transparent py-2 text-sm outline-none placeholder:text-slate-400 w-40"
                  placeholder="Search spices..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1); }} className="border-0 bg-transparent cursor-pointer text-slate-400 hover:text-slate-700">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-8 text-sm focus:ring-[#ec4913] focus:border-[#ec4913] outline-none"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selCats.map((slug) => {
                const cat = categories.find((c) => c.slug === slug);
                return cat ? (
                  <span key={slug} className="flex items-center gap-1 rounded-full bg-[#ec4913]/10 px-3 py-1 text-xs font-bold text-[#ec4913]">
                    {cat.name}
                    <button onClick={() => toggleCat(slug)} className="border-0 bg-transparent cursor-pointer leading-none text-[#ec4913]">×</button>
                  </span>
                ) : null;
              })}
              {selTags.map((slug) => {
                const tag = tags.find((t) => t.slug === slug);
                return tag ? (
                  <span key={slug} className="flex items-center gap-1 rounded-full bg-[#ec4913]/10 px-3 py-1 text-xs font-bold text-[#ec4913]">
                    #{tag.name}
                    <button onClick={() => toggleTag(slug)} className="border-0 bg-transparent cursor-pointer leading-none text-[#ec4913]">×</button>
                  </span>
                ) : null;
              })}
              {isOrganic && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  Organic
                  <button onClick={() => setIsOrganic(false)} className="border-0 bg-transparent cursor-pointer leading-none text-green-700">×</button>
                </span>
              )}
              {inStock && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  In Stock
                  <button onClick={() => setInStock(false)} className="border-0 bg-transparent cursor-pointer leading-none text-blue-700">×</button>
                </span>
              )}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-slate-400 gap-3">
              <span className="material-symbols-outlined text-6xl">search_off</span>
              <p className="font-semibold text-lg">No products found</p>
              <p className="text-sm">Try adjusting your filters or search term.</p>
              <button onClick={clearAll} className="mt-2 text-sm font-bold text-[#ec4913] hover:underline border-0 bg-transparent cursor-pointer">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((p) => {
                const image   = p.primary_image?.image;
                const variant = p.default_variant;
                return (
                  <Link
                    to={`/products/${p.slug}`}
                    key={p.id}
                    className="group relative bg-white rounded-xl overflow-hidden border border-transparent hover:border-[#ec4913]/20 hover:shadow-xl transition-all duration-300 no-underline"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {image ? (
                        <img src={image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-6xl text-slate-200">herbs</span>
                        </div>
                      )}
                      <div className="opacity-0 translate-y-4 absolute bottom-4 left-4 right-4 transition-all duration-300 flex justify-center group-hover:opacity-100 group-hover:translate-y-0">
                        <button
                          onClick={(e) => e.preventDefault()}
                          className="bg-[#ec4913] text-white py-2.5 px-6 rounded-lg font-bold text-sm shadow-lg hover:bg-[#ec4913]/90 flex items-center gap-2 cursor-pointer border-0"
                        >
                          <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                          Quick Add
                        </button>
                      </div>
                      {p.is_organic && (
                        <span className="absolute top-3 left-3 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">Organic</span>
                      )}
                      {p.is_featured && (
                        <span className="absolute top-3 right-3 rounded bg-[#ec4913] px-2 py-0.5 text-[10px] font-bold text-white">Featured</span>
                      )}
                    </div>
                    <div className="p-5">
                      {p.review_count > 0 && (
                        <div className="flex items-center gap-1 mb-1">
                          <StarRating value={p.avg_rating} />
                          <span className="text-[10px] text-slate-400 font-bold ml-1">({p.review_count})</span>
                        </div>
                      )}
                      <h4 className="text-base font-bold text-slate-900 mb-0.5">{p.name}</h4>
                      <p className="text-slate-400 text-xs mb-1">{p.category?.name}</p>
                      {p.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {p.tags.slice(0, 3).map((t) => (
                            <button key={t.slug} onClick={(e) => { e.preventDefault(); toggleTag(t.slug); }} className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 hover:bg-[#ec4913]/10 hover:text-[#ec4913] cursor-pointer border-0 transition-colors">
                              #{t.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {variant ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-[#ec4913]">₹{variant.price}</span>
                            {Number(variant.mrp) > Number(variant.price) && (
                              <span className="text-xs text-slate-400 line-through">₹{variant.mrp}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                        {variant && !variant.is_in_stock && (
                          <span className="text-[10px] font-bold text-red-500 uppercase">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-16 mb-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-[#ec4913] hover:border-[#ec4913] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm transition-all cursor-pointer border ${
                    n === page ? 'bg-[#ec4913] text-white border-[#ec4913]' : 'border-slate-200 text-slate-500 hover:text-[#ec4913] hover:border-[#ec4913] bg-white'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-500 hover:text-[#ec4913] hover:border-[#ec4913] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-white"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-10 px-10 bg-slate-50">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[#ec4913]">
            <span className="material-symbols-outlined">cooking</span>
            <span className="font-bold">Vanvedha</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500 font-medium">
            {['Shipping', 'Returns', 'Sustainability', 'Contact'].map((l) => (
              <a key={l} href="#" className="hover:text-[#ec4913]">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
