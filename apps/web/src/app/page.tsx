'use client';

import { useState, useEffect } from 'react';
import { LucideShieldCheck, LucideLogOut } from 'lucide-react';

import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('mirfa_token');
    if (stored) setToken(stored);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('mirfa_token');
    setToken(null);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white">
      <nav className="border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LucideShieldCheck className="text-blue-500" />
          <h1 className="text-xl font-bold tracking-wider">
            MIRFA<span className="text-blue-500">VAULT</span>
          </h1>
        </div>

        {token && (
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LucideLogOut size={14} /> Logout
          </button>
        )}
      </nav>

      <main className="max-w-5xl mx-auto p-6 mt-10">
        {!token ? (
          <AuthScreen
            onLogin={(t) => {
              setToken(t);
              localStorage.setItem('mirfa_token', t);
            }}
          />
        ) : (
          <Dashboard token={token} />
        )}
      </main>
    </div>
  );
}
