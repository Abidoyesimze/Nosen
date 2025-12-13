'use client';

import React from 'react';
import { useAppKit } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle2 } from 'lucide-react';

const ConnectWallet: React.FC = () => {
  const { theme } = useTheme();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  // Check connection state - address presence is the most reliable indicator
  const connected = isConnected && !!address;

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!connected || !address) {
    return (
      <button
        onClick={() => open()}
        type="button"
        className={`px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
          theme === 'dark'
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 7v12c0 1.1.9 2 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0-2 2v4h-4v-4a2 2 0 0 0-4 0v4H4v-4a2 2 0 0 0-2-2" />
        </svg>
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={() => open({ view: 'Account' })}
      type="button"
      className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
        theme === 'dark'
          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
      }`}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      <span className="font-mono text-sm">{formatAddress(address)}</span>
    </button>
  );
};

export default ConnectWallet;
