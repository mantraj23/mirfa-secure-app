'use client';

import { useState } from 'react';
import { LucideLock, LucideUnlock, LucideLoader2 } from 'lucide-react';

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

  const handleDecrypt = async () => {
    if (loading) return;

    // If already decrypted → toggle back to locked
    if (decrypted) {
      setDecrypted(null);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:3001/tx/${record.id}/decrypt`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        const data = await res.json();
        setDecrypted(data.payload);
      } else {
        alert('Decryption failed or Unauthorized');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all hover:border-zinc-600">
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
        <button
          onClick={handleDecrypt}
          disabled={loading}
          className={`shrink-0 text-xs px-4 py-2 rounded border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
            decrypted
              ? 'bg-red-900/20 border-red-900 text-red-400'
              : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
          } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <>
              <LucideLoader2 size={12} className="animate-spin" />
              Decrypting...
            </>
          ) : decrypted ? (
            <>
              <LucideLock size={12} />
              Lock
            </>
          ) : (
            <>
              <LucideUnlock size={12} />
              Decrypt
            </>
          )}
        </button>
      </div>

      {/* Decrypted Section */}
      {decrypted && (
        <div className="bg-black/50 border-t border-zinc-800 animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-800/50">
            <span className="text-[10px] uppercase text-green-500 font-bold tracking-wider">
              Decrypted Transaction
            </span>
            <CopyButton text={JSON.stringify(decrypted, null, 2)} />
          </div>

          <pre className="p-4 text-xs text-green-400 font-mono overflow-auto max-h-60">
            {JSON.stringify(decrypted, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
