import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  email:    z.email({ error: 'Invalid email' }),
  password: z.string().min(1, 'Password required'),
});

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN9hUi4l8TkYYautLXg5nLSpjeBbL88Z1qjfO5yD-snjvJuSQxqoZviZi3deSiyvFCf8G-uRraaxqxanJ-gM3uvyVVz6xqXr-P1OLMCJr7CwGr7-kQ33d1-wJ2suNkFYgxcuWLAqZdFiAjGqpDfmQxrESX4zMXjefx0rbYh2Umhx2wpD_j-CgSw6Vse5-B24SsBRjKbXIASJ5p6odVd6EHp3kxVs0cP3k-X9NUKuPch93AQEhqLcXpq1BGn9R7tclSdYp3tImg2vFl';

export default function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success('Welcome back!');
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="bg-[#f8f6f6] font-display text-slate-900 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

        {/* ── Left: Image Panel ── */}
        <div className="hidden md:block md:w-1/2 relative min-h-[600px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${HERO_IMG}')` }}
          >
            <div className="absolute inset-0 bg-[#ec4913]/20 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#ec4913] text-4xl">local_mall</span>
              <h2 className="text-3xl font-black tracking-tight">Vanvedha</h2>
            </div>
            <p className="text-lg font-medium opacity-90">
              Unlock the secret to extraordinary dishes. Sign in to your curated collection of world-class flavors.
            </p>
          </div>
        </div>

        {/* ── Right: Form Panel ── */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">

          {/* Mobile Logo */}
          <div className="mb-10 md:hidden flex items-center gap-2 text-[#ec4913]">
            <span className="material-symbols-outlined text-3xl">local_mall</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Vanvedha</h2>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Please enter your details to sign in to your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-sm font-medium text-[#ec4913] hover:underline">Forgot Password?</a>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-[#ec4913] focus:border-transparent outline-none transition-all"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                className="rounded border-slate-300 accent-[#ec4913] h-4 w-4 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember me for 30 days</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#ec4913] hover:bg-[#ec4913]/90 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-[#ec4913]/20 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-8">
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium">Or continue with</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.1 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.9 7.1 29.2 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.9 7.1 29.2 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z"/>
                  <path fill="#4CAF50" d="M24 45c5.2 0 9.9-1.9 13.4-5.1l-6.2-5.2C29.4 36.5 26.8 37.5 24 37.5c-5.2 0-9.6-3.5-11.2-8.2l-6.5 5C9.5 40.4 16.2 45 24 45z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.4l6.2 5.2C37 38.2 44 33 44 25c0-1.3-.1-2.6-.4-3.9z"/>
                </svg>
                <span className="text-sm font-semibold text-slate-700">Google</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                <svg className="w-5 h-5" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-53.8-24.3-89.8-22.8-44.6 1.9-88.7 33.7-111 74-45 81.3-11.5 201.2 32.3 264.4 21.4 30.8 47.1 65 80.5 63.8 32.3-1.3 44.4-20.9 83.5-20.9 39 0 50.3 20.9 83.9 20.2 34.3-.7 57.3-30.8 78.5-61.6 24.3-35.5 34.4-69.8 34.8-71.5-.7-.3-66.9-25.7-67.5-102.3zm-72-167.9c15.9-19.3 26.6-46 23.6-72.7-22.9 1-50.6 15.4-67 34.6-14.8 17.1-27.7 44.5-24.3 70.4 25.5 1.9 51.7-13.1 67.7-32.3z"/>
                </svg>
                <span className="text-sm font-semibold text-slate-700">Apple</span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-slate-600 text-sm">
            New to Vanvedha?{' '}
            <Link to="/register" className="text-[#ec4913] font-bold hover:underline ml-1">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
