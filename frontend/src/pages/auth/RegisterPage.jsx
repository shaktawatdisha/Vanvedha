import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  first_name: z.string().min(1, 'First name required'),
  last_name:  z.string().min(1, 'Last name required'),
  email:      z.email({ error: 'Invalid email' }),
  phone:      z.string().min(10, 'Enter valid phone'),
  password:   z.string().min(8, 'Minimum 8 characters'),
  password2:  z.string(),
}).refine((d) => d.password === d.password2, { message: 'Passwords do not match', path: ['password2'] });

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnE7sGCTJI15abIjZlGB1aiZ9f-5xsjmFGams7klhmyj68HeDMMvq083Yrn9F35iF0rr-Mb4bysKZU9Z5Yx832Umegos-bh37Fz7DRNwXm36WYlvASv0aoxDabwdaYxxS-QgA8RpEEqiPPUwhiRCOA6J7qXvIKsWudSrJze7pCiAjgur3uTL1MHYio8Hu9sa7p0wMWnnnVIb4yYeyskMh3OnLFKKVHXDCK7ldJnLq4UnxV0n5i8s_u9qowQPPPD2XEjBwTbv0cAgO9';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const [showPwd,  setShowPwd]  = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.register(data);
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      const errs = err.response?.data;
      const msg  = errs ? Object.values(errs).flat().join(' ') : 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <div className="bg-[#f8f6f6] font-display text-slate-900 min-h-screen">
      <div className="px-4 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1 bg-white shadow-xl rounded-xl overflow-hidden border border-[#ec4913]/10">

          {/* ── Header ── */}
          <header className="flex items-center justify-between border-b border-[#ec4913]/10 px-6 py-4">
            <Link to="/" className="flex items-center gap-4 text-[#ec4913] no-underline">
              <div className="size-8 flex items-center justify-center bg-[#ec4913]/10 rounded-lg">
                <span className="material-symbols-outlined text-[#ec4913]">skillet</span>
              </div>
              <h2 className="text-slate-900 text-xl font-bold leading-tight tracking-tight">Vanvedha</h2>
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center rounded-lg h-10 bg-[#ec4913]/10 text-[#ec4913] hover:bg-[#ec4913]/20 transition-colors px-4 text-sm font-bold no-underline"
            >
              Sign In
            </Link>
          </header>

          <div className="flex flex-col lg:flex-row">

            {/* ── Left: Hero + Benefit Cards ── */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 bg-[#ec4913]/5">
              <div className="mb-8">
                <div
                  className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[280px] shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(0deg, rgba(34,21,16,0.8) 0%, rgba(34,21,16,0) 60%), url('${HERO_IMG}')`,
                  }}
                >
                  <div className="flex flex-col p-6">
                    <p className="text-white text-3xl font-bold leading-tight">Join the Spice Club</p>
                    <p className="text-white/80 text-sm mt-2">Discover flavors from around the globe.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-slate-900 text-3xl font-black leading-tight tracking-tight">Create Account</p>
                  <p className="text-slate-600 text-base">Start your culinary journey with the finest ingredients and exclusive member perks.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 rounded-xl p-5 border border-[#ec4913]/20 bg-white shadow-sm">
                    <span className="material-symbols-outlined text-[#ec4913]">redeem</span>
                    <p className="text-slate-900 text-sm font-semibold">Welcome Offer</p>
                    <p className="text-[#ec4913] tracking-tight text-2xl font-black">10% Off</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">First Order</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl p-5 border border-[#ec4913]/20 bg-white shadow-sm">
                    <span className="material-symbols-outlined text-[#ec4913]">stars</span>
                    <p className="text-slate-900 text-sm font-semibold">Loyalty Program</p>
                    <p className="text-[#ec4913] tracking-tight text-2xl font-black">Earn Rewards</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Every Purchase</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Registration Form ── */}
            <div className="w-full lg:w-1/2 p-6 md:p-10 flex flex-col justify-center">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* First Name + Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">First Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">person</span>
                      <input
                        {...register('first_name')}
                        type="text"
                        placeholder="First name"
                        className="w-full pl-10 pr-3 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">Last Name</label>
                    <div className="relative">
                      <input
                        {...register('last_name')}
                        type="text"
                        placeholder="Last name"
                        className="w-full px-3 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all text-sm"
                      />
                    </div>
                    {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name.message}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">phone</span>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="Enter your phone number"
                      className="w-full pl-12 pr-4 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input
                      {...register('password')}
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="w-full pl-12 pr-12 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined">{showPwd ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Minimum 8 characters with numbers &amp; symbols</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-slate-900 text-sm font-bold uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                    <input
                      {...register('password2')}
                      type={showPwd2 ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="w-full pl-12 pr-12 py-4 rounded-lg border border-[#ec4913]/10 bg-[#f8f6f6] focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd2((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer"
                    >
                      <span className="material-symbols-outlined">{showPwd2 ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2.message}</p>}
                </div>

                {/* Newsletter Checkbox */}
                <div className="flex items-start gap-3 py-1">
                  <input
                    type="checkbox"
                    id="newsletter"
                    className="mt-1 rounded accent-[#ec4913] h-4 w-4 border-[#ec4913]/20 cursor-pointer"
                  />
                  <label htmlFor="newsletter" className="text-slate-600 text-sm cursor-pointer leading-tight">
                    Subscribe to the <span className="text-[#ec4913] font-bold">Spice Club</span> newsletter for exclusive recipes, deals, and new arrivals.
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#ec4913] hover:bg-[#ec4913]/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-[#ec4913]/20 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>

                {/* Footer link */}
                <div className="pt-6 border-t border-[#ec4913]/10 text-center">
                  <p className="text-slate-600 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#ec4913] font-bold hover:underline underline-offset-4">
                      Log in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* ── Footer Note ── */}
          <footer className="p-6 bg-[#f8f6f6] text-center border-t border-[#ec4913]/10">
            <p className="text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="underline">Terms of Service</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
