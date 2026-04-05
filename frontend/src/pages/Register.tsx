import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, FormEvent } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', emailConfirm: '', username: '', password: '', fullName: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.email !== form.emailConfirm) { setError('Emails do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/\d/.test(form.password)) { setError('Password must contain at least one number.'); return; }
    setLoading(true);
    try {
      await register(form.email, form.username, form.password, form.fullName || undefined);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header variant="dark" />

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left: Copy */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16">
          <div className="max-w-md w-full">
            <h1 className="text-5xl font-bold text-white mb-6">Get a free account</h1>
            <p className="text-gray-400 text-lg mb-6">
              Join thousands of investors using FundVision Pro to find and track the best mutual funds in India.
            </p>
            <p className="text-gray-400 text-sm">
              Already registered?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Login here.</Link>
            </p>
            <div className="mt-16 border-l-2 border-emerald-500 pl-4">
              <p className="text-gray-300 italic text-sm mb-2">"I started investing at the age of 11. I was late!"</p>
              <p className="text-white font-semibold text-sm">Warren Buffett</p>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 py-8">
          <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">

            <button className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors mb-6">
              <GoogleIcon /> REGISTER USING GOOGLE
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-gray-400">or using email</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name (optional)</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Your name"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input type="text" required value={form.username} onChange={update('username')} placeholder="e.g. investor_raj"
                  pattern="^[a-zA-Z0-9_]+$" minLength={3} maxLength={30}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input type="email" required value={form.email} onChange={update('email')}
                  className="w-full px-4 py-3 bg-slate-700 border-2 border-blue-500 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Re-enter Email</label>
                <p className="text-xs text-gray-400 mb-2">We promise we won't spam</p>
                <input type="email" required value={form.emailConfirm} onChange={update('emailConfirm')}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={update('password')} minLength={8}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12" />
                  <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Min 8 chars, must include a number</p>
              </div>

              <p className="text-xs text-gray-400">
                By registering you agree to the{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Use</a> and have read the{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>.
              </p>

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Creating…</> : <><UserPlus className="w-5 h-5" /> CREATE ACCOUNT</>}
              </button>

              <p className="text-center text-gray-400 text-sm">
                Already registered?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">Login here.</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
