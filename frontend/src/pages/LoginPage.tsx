import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { login, register, getMe } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { access_token } = await login(email, password);
      useAuthStore.setState({ token: access_token });
      const user = await getMe();
      return { access_token, user };
    },
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user);
      navigate('/');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      await register(email, password, name);
      const { access_token } = await login(email, password);
      useAuthStore.setState({ token: access_token });
      const user = await getMe();
      return { access_token, user };
    },
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user);
      navigate('/');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLogin) {
      loginMutation.mutate();
    } else {
      registerMutation.mutate();
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="bg-slate-900 min-h-screen flex items-center justify-center px-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl">🇭🇰</span>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">CalTrack</h1>
          <p className="text-slate-400 text-sm mt-1">HK Food & Calorie Tracker</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              isLogin
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              !isLogin
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Your name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
