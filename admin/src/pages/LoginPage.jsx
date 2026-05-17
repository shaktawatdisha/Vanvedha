import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email:    z.email({ error: 'Invalid email' }),
  password: z.string().min(1, 'Password required'),
});

export default function LoginPage() {
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  // Already authenticated → hard redirect so ProtectedRoute hydrates correctly
  if (isAuthenticated && user?.role === 'ADMIN') {
    window.location.replace('/dashboard');
    return null;
  }

  const onSubmit = async (values) => {
    try {
      const { data } = await authApi.login(values);
      // Persist auth state BEFORE navigating
      setAuth(data.user, data.access, data.refresh);
      toast.success(`Welcome back, ${data.user?.first_name || 'Admin'}!`);
      // Hard navigate: forces full re-mount so ProtectedRoute reads fresh state
      window.location.replace('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Login failed';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-4xl text-[#ec4913]">skillet</span>
            <span className="text-2xl font-black text-stone-900">Vanvedha</span>
          </div>
          <p className="text-xs font-bold tracking-widest text-[#ec4913] uppercase">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200 p-8">
          <h2 className="text-2xl font-black text-stone-900 mb-1">Sign In</h2>
          <p className="text-sm text-stone-500 mb-6">Admin access only</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">mail</span>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@vanvedha.com"
                  className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xl">lock</span>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ec4913]/30 focus:border-[#ec4913]"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#ec4913] text-white rounded-xl font-bold text-sm hover:bg-[#d43d0f] transition-colors disabled:opacity-60 cursor-pointer mt-2"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Vanvedha Admin Panel · Restricted Access
        </p>
      </div>
    </div>
  );
}
