import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi } from '../api/catalog';

const whyUs = [
  { icon: 'eco',                label: 'Ethically Sourced', desc: 'Direct trade relationships with small-scale farmers worldwide, ensuring fair wages and sustainable practices.' },
  { icon: 'stockpot',           label: 'Freshly Ground',    desc: 'Small-batch processing and cold-grinding techniques preserve the volatile oils for maximum aroma and flavor.' },
  { icon: 'workspace_premium',  label: 'Chef Approved',     desc: 'Trusted by Michelin-star kitchens and home gourmets alike for purity and consistent culinary performance.' },
];

function ProductCard({ product }) {
  const image   = product.primary_image?.image;
  const variant = product.default_variant;

  return (
    <Link to={`/products/${product.slug}`} className="group flex flex-col gap-4 no-underline">
      <div className="relative overflow-hidden rounded-xl aspect-square bg-[#f8f6f6]">
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-[#ec4913]/20">herbs</span>
          </div>
        )}
        {product.is_organic && (
          <span className="absolute top-3 left-3 rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">Organic</span>
        )}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur text-slate-900 py-2 rounded-lg font-bold text-sm text-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
          Quick Add
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-slate-900 text-base font-bold leading-snug">{product.name}</h3>
          {variant && (
            <span className="text-[#ec4913] font-bold shrink-0">₹{variant.price}</span>
          )}
        </div>
        <p className="text-xs text-slate-400">{product.category?.name}</p>
        {product.review_count > 0 && (
          <div className="flex items-center gap-1 text-amber-500">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-slate-500 text-sm font-medium">
              {Number(product.avg_rating).toFixed(1)} ({product.review_count} reviews)
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="rounded-xl aspect-square bg-slate-200" />
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    catalogApi.getProducts()
      .then((res) => setProducts(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#f8f6f6] font-display text-slate-900 overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="px-6 lg:px-40 py-10">
        <div className="flex flex-col gap-6 lg:gap-12 lg:flex-row items-center">
          <div
            className="w-full bg-center bg-no-repeat aspect-video lg:aspect-square bg-cover rounded-xl shadow-2xl flex-1 border-8 border-white"
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDV8jYaIyXIyRuOc_TUKZ_8MenrhGirSLxOwZ282g0pEswlmGAHi2MNvuQHkzGQUH5YKRH_sqm_2OpUzp1Pp0i-r0KT6EuYtVtlvfEX1DzR4Wl55DJ9dGxOSOln78iMY4iUgDGoQ-_47U2ctL0fYofsKk-s0KNC22kTz88LPrQi0SFhuuvHsgdX-hVlnZ3RCdgs53onFhSKlEKKeCikW-5evELZ4HP8nQ6fAG2UA8WQgqVmQ2Paxm8BkZFF072om9QH3Zg_YYxXVL3D')` }}
          />
          <div className="flex flex-col gap-6 flex-1 text-center lg:text-left">
            <div className="flex flex-col gap-4">
              <span className="text-[#ec4913] font-bold tracking-widest text-sm uppercase">Artisanal Quality</span>
              <h1 className="text-slate-900 text-4xl lg:text-6xl font-black leading-[1.1] tracking-tight">
                Elevate Every <span className="text-[#ec4913]">Meal</span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                Discover the world's finest, ethically sourced spices delivered directly from sustainable farms to your kitchen.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/products" className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-[#ec4913] text-white text-base font-bold hover:scale-105 transition-transform">
                Shop All Spices
              </Link>
              <button className="flex min-w-[180px] cursor-pointer items-center justify-center rounded-lg h-12 px-6 border-2 border-[#ec4913]/20 bg-white text-[#ec4913] text-base font-bold hover:bg-[#ec4913]/5 transition-colors">
                Our Story
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── All Products ── */}
      <section className="bg-white py-16 px-6 lg:px-40">
        <div className="flex items-end justify-between mb-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-slate-900 text-3xl font-bold tracking-tight">Our Spices</h2>
            <div className="h-1 w-20 bg-[#ec4913] rounded-full" />
          </div>
          <Link to="/products" className="text-[#ec4913] font-bold text-sm flex items-center gap-1 hover:underline">
            View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-slate-400 gap-3">
            <span className="material-symbols-outlined text-5xl">inventory_2</span>
            <p className="font-semibold">No products available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── Why Us ── */}
      <section className="px-6 lg:px-40 py-20 bg-[#f8f6f6]">
        <div className="max-w-3xl mb-12">
          <h2 className="text-slate-900 text-3xl lg:text-4xl font-black mb-4 tracking-tight">Why Choose Vanvedha?</h2>
          <p className="text-slate-600 text-lg">We believe that great food starts with exceptional ingredients. Quality you can taste in every pinch.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {whyUs.map(({ icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-5 p-8 rounded-2xl bg-white shadow-sm border border-[#ec4913]/5 hover:shadow-md transition-shadow">
              <div className="bg-[#ec4913]/10 text-[#ec4913] w-14 h-14 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">{icon}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-slate-900 text-xl font-bold">{label}</h3>
                <p className="text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter / Footer CTA ── */}
      <section className="bg-slate-900 text-white px-6 lg:px-40 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Join the Spice Club and <span className="text-[#ec4913]">get 10% off</span> your first order
            </h2>
            <p className="text-slate-400 text-lg">Receive curated recipes, spice guides, and exclusive early access to our seasonal harvests.</p>
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <input className="flex-1 bg-slate-800 border-none rounded-lg h-12 px-4 focus:ring-2 focus:ring-[#ec4913] text-white outline-none" placeholder="Enter your email" type="email" />
              <button className="bg-[#ec4913] hover:bg-[#ec4913]/90 transition-colors h-12 px-8 rounded-lg font-bold">Subscribe</button>
            </form>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            {[
              { title: 'Shop',    links: ['Individual Spices', 'Spice Blends', 'Gift Sets', 'Bundles'] },
              { title: 'Company', links: ['Our Story', 'Sustainability', 'Wholesale', 'Contact'] },
            ].map(({ title, links }) => (
              <div key={title} className="flex flex-col gap-4">
                <h4 className="font-bold text-white uppercase text-xs tracking-widest">{title}</h4>
                <ul className="flex flex-col gap-2 text-slate-400 text-sm">
                  {links.map((l) => <li key={l}><a href="#" className="hover:text-[#ec4913] transition-colors">{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-800 text-slate-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2024 Vanvedha. All rights reserved.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'Terms of Service', 'Shipping Info'].map((l) => (
              <a key={l} href="#" className="hover:text-[#ec4913]">{l}</a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
