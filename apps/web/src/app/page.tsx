'use client';
import { useState, useEffect } from 'react';
import { LucideLock, LucideUnlock, LucideShieldCheck, LucideLogOut } from 'lucide-react';

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
      {/* Header */}
      <nav className="border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <LucideShieldCheck className="text-blue-500" />
          <h1 className="text-xl font-bold tracking-wider">MIRFA<span className="text-blue-500">VAULT</span></h1>
        </div>
        {token && (
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
            <LucideLogOut size={14} /> Logout
          </button>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 mt-10">
        {!token ? (
          <AuthScreen onLogin={(t) => { setToken(t); localStorage.setItem('mirfa_token', t); }} />
        ) : (
          <Dashboard token={token} />
        )}
      </main>
    </div>
  );
}

// --- AUTH COMPONENT ---
function AuthScreen({ onLogin }: { onLogin: (t: string) => void }) {
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
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'User' })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      
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
        <h2 className="text-2xl font-bold mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="text-gray-400 mb-6 text-sm">Secure your digital assets with envelope encryption.</p>
        
        {error && <div className="bg-red-900/30 text-red-400 p-3 rounded text-sm mb-4 border border-red-900">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full bg-black border border-zinc-700 p-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-black border border-zinc-700 p-3 rounded focus:outline-none focus:border-blue-500 transition-colors"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-gray-500 hover:text-white transition-colors">
            {isLogin ? "Need an account? Sign up" : "Have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard({ token }: { token: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [partyId, setPartyId] = useState('');
  const [payload, setPayload] = useState('{"amount": 1000, "currency": "USD"}');
  const [loading, setLoading] = useState(false);

  // Fetch records
  const fetchRecords = async () => {
    const res = await fetch('http://localhost:3001/tx', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setRecords(await res.json());
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleEncrypt = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/tx/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ partyId, payload: JSON.parse(payload) })
      });
      if (res.ok) {
        setPartyId('');
        fetchRecords();
      } else {
        alert("Failed to encrypt");
      }
    } catch (e) {
      alert("Invalid JSON");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      {/* Encryption Form */}
      <section>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-900/20 rounded-full text-blue-500"><LucideLock size={20} /></div>
            <div>
              <h2 className="text-lg font-bold">New Secure Transaction</h2>
              <p className="text-xs text-gray-400">Data will be encrypted with a unique DEK.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">Party ID</label>
              <input 
                value={partyId}
                onChange={e => setPartyId(e.target.value)}
                placeholder="e.g. Vendor-X" 
                className="w-full bg-black border border-zinc-700 p-3 rounded text-sm focus:border-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">Payload (JSON)</label>
              <textarea 
                value={payload}
                onChange={e => setPayload(e.target.value)}
                className="w-full h-32 bg-black border border-zinc-700 p-3 rounded text-sm font-mono focus:border-blue-500 outline-none" 
              />
            </div>
            <button 
              onClick={handleEncrypt} 
              disabled={loading}
              className="w-full bg-white text-black font-bold p-3 rounded hover:bg-gray-200 transition-colors"
            >
              {loading ? 'Encrypting...' : 'Encrypt & Store'}
            </button>
          </div>
        </div>
      </section>

      {/* Records List */}
      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LucideShieldCheck className="text-green-500" /> Your Vault
        </h2>
        <div className="space-y-3">
          {records.length === 0 && <p className="text-gray-500 italic">No records found. Create one.</p>}
          {records.map(rec => <RecordItem key={rec.id} record={rec} token={token} />)}
        </div>
      </section>
    </div>
  );
}

function RecordItem({ record, token }: { record: any, token: string }) {
  const [decrypted, setDecrypted] = useState<any>(null);

  const handleDecrypt = async () => {
    if (decrypted) { setDecrypted(null); return; } // Toggle off
    
    const res = await fetch(`http://localhost:3001/tx/${record.id}/decrypt`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      setDecrypted(data.payload);
    } else {
      alert("Decryption failed or Unauthorized");
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-600">
      <div className="p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-gray-300">{record.partyId}</h3>
          <p className="text-xs text-gray-600 font-mono mt-1">ID: {record.id.slice(0, 8)}...</p>
        </div>
        <button 
          onClick={handleDecrypt}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${decrypted ? 'bg-red-900/20 border-red-900 text-red-400' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
        >
          {decrypted ? <span className="flex items-center gap-1"><LucideLock size={12}/> Lock</span> : <span className="flex items-center gap-1"><LucideUnlock size={12}/> Decrypt</span>}
        </button>
      </div>
      
      {/* Ciphertext Preview */}
      {!decrypted && (
        <div className="px-4 pb-4">
          <div className="text-[10px] text-gray-700 bg-black p-2 rounded font-mono truncate">
            {record.payload_ct}
          </div>
        </div>
      )}

      {/* Decrypted View */}
      {decrypted && (
        <div className="bg-black/50 p-4 border-t border-zinc-800 animate-in slide-in-from-top-2">
          <pre className="text-xs text-green-400 font-mono overflow-auto">
            {JSON.stringify(decrypted, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}