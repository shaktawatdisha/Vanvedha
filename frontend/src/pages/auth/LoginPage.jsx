import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await authApi.googleLogin(credentialResponse.credential);
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success('Welcome back!');
      navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Google sign-in failed');
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
            <div className="flex justify-center mt-2">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
              />
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
