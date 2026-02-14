'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideLock, LucideShieldCheck } from 'lucide-react';
import { API_URL } from '../constants/BackendApi';
import { RecordType } from '../types';
import RecordItem from './RecordItem';

interface DashboardProps {
  token: string;
}

export default function Dashboard({ token }: DashboardProps) {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [partyId, setPartyId] = useState('');
  const [payload, setPayload] = useState(
    '{"amount": 1000, "currency": "USD"}'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const res = await fetch(`${API_URL}/tx`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch {
      setError('Failed to fetch records');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleEncrypt = async () => {
    setError(null);

    try {
      setLoading(true);

      const parsedPayload = JSON.parse(payload);

      const res = await fetch(`${API_URL}/tx/encrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partyId,
          payload: parsedPayload
        })
      });

      if (!res.ok) {
        throw new Error('Encryption failed');
      }

      setPartyId('');
      await fetchRecords();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format');
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10 min-h-[75vh]">
      
      {/* LEFT SIDE */}
      <motion.section
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="p-3 bg-blue-900/20 rounded-full text-blue-500"
            >
              <LucideLock size={20} />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold">
                New Secure Transaction
              </h2>
              <p className="text-xs text-gray-400">
                Data will be encrypted with a unique DEK.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">
                Party ID
              </label>

              <input
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                placeholder="e.g. Vendor-X"
                className="w-full bg-black border border-zinc-700 p-3 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">
                Payload (JSON)
              </label>

              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full h-32 bg-black border border-zinc-700 p-3 rounded text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleEncrypt}
              disabled={loading}
              className="w-full bg-white text-black font-bold p-3 rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Encrypting...' : 'Encrypt & Store'}
            </motion.button>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.section>

      {/* RIGHT SIDE */}
      <motion.section
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col max-h-[75vh]"
      >
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
          <LucideShieldCheck className="text-green-500" />
          Your Vault
        </h2>

        <div className="space-y-3 overflow-y-auto mac-scrollbar flex-1 pr-1">
          {records.length === 0 && (
            <p className="text-gray-500 italic">
              No records found. Create one.
            </p>
          )}

          <AnimatePresence>
            {records.map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RecordItem record={rec} token={token} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
