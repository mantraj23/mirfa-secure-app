'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LucideLock,
  LucideUnlock,
  LucideLoader2
} from 'lucide-react';
import { API_URL } from '../constants/BackendApi';
import { RecordType } from '../types';
import CopyButton from './CopyButton';

interface RecordItemProps {
  record: RecordType;
  token: string;
}

export default function RecordItem({
  record,
  token
}: RecordItemProps) {
  const [decrypted, setDecrypted] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (loading) return;

    // Toggle lock if already decrypted
    if (decrypted) {
      setDecrypted(null);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const res = await fetch(
        `${API_URL}/tx/${record.id}/decrypt`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) {
        throw new Error('Unauthorized or failed to decrypt');
      }

      const data = await res.json();
      setDecrypted(data.payload);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all
        ${
          decrypted
            ? 'border-green-800 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
            : 'border-zinc-800 hover:border-zinc-600'
        }`}
    >
      <div className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-3 w-full">
          {/* Party ID */}
          <div>
            <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">
              Party ID
            </span>
            <h3 className="font-bold text-base text-white">
              {record.partyId}
            </h3>
          </div>

          {/* Transaction ID */}
          <div>
            <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
              Transaction ID
            </span>

            <div className="flex items-center gap-2 group">
              <p className="text-xs text-gray-400 font-mono break-all">
                {record.id}
              </p>
              <CopyButton text={record.id} />
            </div>
          </div>

          {/* Created At */}
          <div>
            <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">
              Created At
            </span>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDecrypt}
          disabled={loading}
          className={`shrink-0 text-xs px-4 py-2 rounded border transition-all duration-200 flex items-center gap-2
            ${
              decrypted
                ? 'bg-red-900/20 border-red-900 text-red-400'
                : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
            }
            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <LucideLoader2 size={12} className="animate-spin" />
                Decrypting...
              </motion.span>
            ) : decrypted ? (
              <motion.span
                key="lock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <LucideLock size={12} />
                Lock
              </motion.span>
            ) : (
              <motion.span
                key="unlock"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <LucideUnlock size={12} />
                Decrypt
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ERROR */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs px-4 pb-2"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decrypted Section */}
      <AnimatePresence>
        {decrypted && (
          <motion.div
            key="decrypted"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-black/50 border-t border-zinc-800 overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800/50">
              <span className="text-[10px] uppercase text-green-500 font-bold tracking-wider">
                Decrypted Transaction
              </span>
              <CopyButton text={JSON.stringify(decrypted, null, 2)} />
            </div>

            <pre className="p-4 text-xs text-green-400 font-mono overflow-auto max-h-60">
              {JSON.stringify(decrypted, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
