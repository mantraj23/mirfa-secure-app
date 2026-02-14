'use client';
import {API_URL} from '../constants/BackendApi' ;
import { useState } from 'react';

interface AuthScreenProps {
  onLogin: (token: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'User' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <p className="text-gray-400 mb-6 text-sm">
          Secure your digital assets with envelope encryption.
        </p>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-3 rounded text-sm mb-4 border border-red-900">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full bg-black border border-zinc-700 p-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black border border-zinc-700 p-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            {isLogin
              ? 'Need an account? Sign up'
              : 'Have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
