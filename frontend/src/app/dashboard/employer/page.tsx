'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  History,
  Wallet
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { RoleGuard } from '../../components/RoleGuard';
import RegistrationGuard from '../../components/RegistrationGuard';
import EmployerSidebar from '../../components/EmployerSidebar';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import ConnectWallet from '../../components/ConnectWallet';
import { useSetup } from '../../contexts/SetupContext';

const EmployerDashboard = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { isSetupComplete } = useSetup();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isSetupComplete()) {
      router.push('/dashboard/employer/setup');
    }
  }, [isSetupComplete, router]);


  const stats = [
    { label: 'Total Employees', value: '0', icon: <Users className="w-5 h-5" /> },
    { label: 'Account Balance', value: '$0.00', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Monthly Payroll', value: '$0.00', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Transactions', value: '0', icon: <History className="w-5 h-5" /> }
  ];

  if (!isSetupComplete()) {
    return (
      <RoleGuard allowedRole="employer">
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Redirecting to setup...
              </p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!isConnected) {
    return (
      <RoleGuard allowedRole="employer">
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Connect Your Wallet
              </h2>
              <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Please connect your wallet to access the employer dashboard
              </p>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole="employer">
      <RegistrationGuard role="employer">
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <EmployerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <div className="md:ml-64">
          {/* Top Bar */}
          <div className={`sticky top-0 z-30 border-b ${
            theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center gap-4">
                <ConnectWallet />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-8">
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Employer Dashboard
                </h1>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage your company payroll, employees, and automated payments
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`rounded-xl p-6 border ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-700'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-emerald-500/10 text-emerald-500`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {stat.value}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </main>
        </div>
      </div>
      </RegistrationGuard>
    </RoleGuard>
  );
};

export default EmployerDashboard;

