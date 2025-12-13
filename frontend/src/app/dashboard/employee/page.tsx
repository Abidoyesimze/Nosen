'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  History,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { RoleGuard } from '../../components/RoleGuard';
import RegistrationGuard from '../../components/RegistrationGuard';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import ConnectWallet from '../../components/ConnectWallet';

const EmployeeDashboard = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);


  const stats = [
    { label: 'Wallet Balance', value: '$0.00', icon: <Wallet className="w-5 h-5" /> },
    { label: 'This Month', value: '$0.00', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Total Received', value: '$0.00', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Transactions', value: '0', icon: <History className="w-5 h-5" /> }
  ];

  return (
    <RoleGuard allowedRole="employee">
      <RegistrationGuard role="employee">
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <EmployeeSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
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
                  Employee Dashboard
                </h1>
                <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  View your balance, withdraw funds, and track your payment history
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
                      <div className={`p-3 rounded-lg bg-teal-500/10 text-teal-500`}>
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

              {/* Recent Transactions */}
              <div className={`rounded-xl p-6 border ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Recent Transactions
                  </h2>
                  <button
                    onClick={() => router.push('/dashboard/employee/transactions')}
                    className="text-emerald-500 hover:text-emerald-600 text-sm font-semibold"
                  >
                    View All
                  </button>
                </div>
                <div className="text-center py-12">
                  <History className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    No transactions yet. Your monthly salary payments will appear here.
                  </p>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
      </RegistrationGuard>
    </RoleGuard>
  );
};

export default EmployeeDashboard;

