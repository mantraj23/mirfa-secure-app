'use client';

import { API_URL } from '../constants/BackendApi';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthScreenProps {
  onLogin: (token: string) => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  // 1. Add state for success message
  const [success, setSuccess] = useState<string | null>(null); 
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setError(null);
    setFieldErrors({});
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null); 
    setFieldErrors({});

    if (!email || !password) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(isLogin ? {} : { name: 'User' })
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let extractedFieldErrors: FieldErrors = {};
        let message = 'Something went wrong';

        if (typeof data?.error === 'string') {
          let parsed;
          try {
            parsed = JSON.parse(data.error);
          } catch {
            parsed = null;
          }

          if (Array.isArray(parsed)) {
            parsed.forEach((e: any) => {
              if (e?.path?.[0]) {
                extractedFieldErrors[e.path[0] as keyof FieldErrors] = e.message;
              }
            });
            if (Object.keys(extractedFieldErrors).length > 0) {
              setFieldErrors(extractedFieldErrors);
              return;
            }
            message = parsed.map((e: any) => e.message).join(', ');
          } else {
            message = data.error;
          }
        } else if (Array.isArray(data)) {
          data.forEach((e: any) => {
            if (e?.path?.[0]) {
              extractedFieldErrors[e.path[0] as keyof FieldErrors] = e.message;
            }
          });
          if (Object.keys(extractedFieldErrors).length > 0) {
            setFieldErrors(extractedFieldErrors);
            return;
          }
          message = data.map((e: any) => e.message).join(', ');
        }
        throw new Error(message);
      }

      if (isLogin) {
        onLogin(data.token);
      } else {
        setIsLogin(true);
        setSuccess('Account created successfully! Please login.');
      }

    } catch (err: any) {
      setError(err.message || 'Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl"
      >
        <motion.h2
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold mb-2"
        >
          {isLogin ? 'Welcome Back 👋' : 'Create Account 🚀'}
        </motion.h2>

        <p className="text-gray-400 mb-6 text-sm">
          Secure your digital assets with envelope encryption.
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/30 mb-4"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/10 text-green-400 p-3 rounded-lg text-sm border border-green-500/30 mb-4"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              className={`w-full bg-black border p-3 rounded focus:outline-none transition ${
                fieldErrors.email
                  ? 'border-red-500'
                  : 'border-zinc-700 focus:border-blue-500'
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if(success) setSuccess(null);
              }}
              disabled={loading}
              required
            />
            {fieldErrors.email && (
              <p className="text-red-400 text-sm mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className={`w-full bg-black border p-3 rounded focus:outline-none transition pr-16 ${
                fieldErrors.password
                  ? 'border-red-500'
                  : 'border-zinc-700 focus:border-blue-500'
              }`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if(success) setSuccess(null); 
              }}
              disabled={loading}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>

            {fieldErrors.password && (
              <p className="text-red-400 text-sm mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setSuccess(null); 
            }}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            {isLogin
              ? 'Need an account? Sign up'
              : 'Have an account? Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}