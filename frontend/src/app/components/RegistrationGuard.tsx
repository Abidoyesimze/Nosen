'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useIsEmployerRegistered, useIsEmployeeRegistered } from '../../hooks/usePayroll';
import RegisterOnContract from './RegisterOnContract';
import ConnectWallet from './ConnectWallet';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface RegistrationGuardProps {
  role: 'employer' | 'employee';
  children: React.ReactNode;
}

/**
 * RegistrationGuard Component
 * 
 * Ensures user is registered on the contract before allowing access to protected routes.
 * Shows registration form if not registered, or children if registered.
 */
const RegistrationGuard: React.FC<RegistrationGuardProps> = ({ role, children }) => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  const { data: isEmployerRegistered, isLoading: checkingEmployer } = useIsEmployerRegistered();
  const { data: isEmployeeRegistered, isLoading: checkingEmployee } = useIsEmployeeRegistered();
  const { data: isOtherRoleRegistered } = role === 'employer' 
    ? useIsEmployeeRegistered() 
    : useIsEmployerRegistered();

  const isRegistered = role === 'employer' ? isEmployerRegistered : isEmployeeRegistered;
  const isLoading = role === 'employer' ? checkingEmployer : checkingEmployee;

  // Check if registered in opposite role
  if (isConnected && isOtherRoleRegistered) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Role Conflict
            </h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600 mb-4'}>
              This address is already registered as {role === 'employer' ? 'an employee' : 'an employer'}.
              Each address can only have one role.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center">
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Connect Your Wallet
            </h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600 mb-6'}>
              Please connect your wallet to access this page
            </p>
            <ConnectWallet />
          </div>
        </div>
      </div>
    );
  }

  // Loading registration status
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Not registered - show registration form
  if (!isRegistered) {
    return (
      <RegisterOnContract
        role={role}
        onRegistrationComplete={() => {
          // Registration complete, component will re-render and show children
          window.location.reload();
        }}
      />
    );
  }

  // Registered - show protected content
  return <>{children}</>;
};

export default RegistrationGuard;



