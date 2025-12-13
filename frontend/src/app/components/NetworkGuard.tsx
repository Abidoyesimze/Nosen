'use client';

import React, { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { liskSepolia } from 'wagmi/chains';
import { useTheme } from '../contexts/ThemeContext';

const LISK_SEPOLIA_CHAIN_ID = 4202;

/**
 * NetworkGuard Component
 * 
 * Automatically checks if the user is on the correct network (Lisk Sepolia)
 * and prompts them to switch if needed. This component should be placed
 * high in the component tree to protect all routes.
 */
const NetworkGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { theme } = useTheme();

  // Check if we're on the wrong network
  const isWrongNetwork = isConnected && chainId !== LISK_SEPOLIA_CHAIN_ID;

  // Auto-switch to Lisk Sepolia if on wrong network
  useEffect(() => {
    if (isWrongNetwork && !isSwitching) {
      try {
        switchChain({ chainId: LISK_SEPOLIA_CHAIN_ID });
      } catch (error) {
        console.error('Failed to switch chain:', error);
      }
    }
  }, [isWrongNetwork, isSwitching, switchChain]);

  // If not connected, show children (wallet connection will be handled elsewhere)
  if (!isConnected) {
    return <>{children}</>;
  }

  // If on wrong network, show a message
  if (isWrongNetwork) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      }`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-xl border ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100'
            }`}>
              <svg
                className={`w-8 h-8 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Wrong Network
            </h2>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              This app requires the <strong>Lisk Sepolia</strong> network.
              {isSwitching ? (
                <span className="block mt-2">Switching network...</span>
              ) : (
                <span className="block mt-2">Please switch your wallet to Lisk Sepolia to continue.</span>
              )}
            </p>
            {!isSwitching && (
              <button
                onClick={() => switchChain({ chainId: LISK_SEPOLIA_CHAIN_ID })}
                className="w-full px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all"
              >
                Switch to Lisk Sepolia
              </button>
            )}
            {isSwitching && (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Switching network...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If on correct network, show children
  return <>{children}</>;
};

export default NetworkGuard;


