'use client';

import { useState, useEffect } from 'react';
import { LucideLock, LucideShieldCheck } from 'lucide-react';

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

  const fetchRecords = async () => {
    const res = await fetch('http://localhost:3001/tx', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      setRecords(data);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleEncrypt = async () => {
    try {
      setLoading(true);

      const res = await fetch('http://localhost:3001/tx/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partyId,
          payload: JSON.parse(payload)
        })
      });

      if (res.ok) {
        setPartyId('');
        fetchRecords();
      } else {
        alert('Failed to encrypt');
      }
    } catch {
      alert('Invalid JSON');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-10 min-h-[75vh]">
      
      {/* LEFT SIDE */}
      <section>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-900/20 rounded-full text-blue-500">
              <LucideLock size={20} />
            </div>
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
                className="w-full bg-black border border-zinc-700 p-3 rounded text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2 block">
                Payload (JSON)
              </label>

              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full h-32 bg-black border border-zinc-700 p-3 rounded text-sm font-mono focus:border-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleEncrypt}
              disabled={loading}
              className="w-full bg-white text-black font-bold p-3 rounded hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {loading ? 'Encrypting...' : 'Encrypt & Store'}
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="flex flex-col max-h-[75vh]">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0">
          <LucideShieldCheck className="text-green-500" /> Your Vault
        </h2>

        <div className="space-y-3 overflow-y-auto mac-scrollbar flex-1 pr-1">
          {records.length === 0 && (
            <p className="text-gray-500 italic">
              No records found. Create one.
            </p>
          )}

          {records.map((rec) => (
            <RecordItem key={rec.id} record={rec} token={token} />
          ))}
        </div>
      </section>
    </div>
  );
}
