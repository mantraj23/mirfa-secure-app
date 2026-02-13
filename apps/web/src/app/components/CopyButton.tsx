'use client';

import { useState } from 'react';
import { LucideCopy, LucideCheck } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`hover:bg-white/10 p-1.5 rounded transition-colors cursor-pointer ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <LucideCheck size={14} className="text-green-500" />
      ) : (
        <LucideCopy size={14} className="text-gray-500 hover:text-white" />
      )}
    </button>
  );
}
