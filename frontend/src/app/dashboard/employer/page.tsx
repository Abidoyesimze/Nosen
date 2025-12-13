'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  History,
  Wallet,
  Building2,
  Mail,
  MapPin,
  ExternalLink,
  Copy,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { RoleGuard } from '../../components/RoleGuard';
import RegistrationGuard from '../../components/RegistrationGuard';
import EmployerSidebar from '../../components/EmployerSidebar';
import { useAccount, usePublicClient, useBalance } from 'wagmi';
import { useRouter } from 'next/navigation';
import ConnectWallet from '../../components/ConnectWallet';
import { useEmployerProfile } from '../../../hooks/usePayroll';
import { formatEmployer } from '../../../services/payrollService';
import { useMultisigWalletData } from '../../../hooks/useMultisigWallet';
import { Address, formatEther, formatUnits } from 'viem';
import { toast } from 'react-toastify';

const EmployerDashboard = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const router = useRouter();
  const { isSetupComplete } = useSetup();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Fetch employer data from contract
  const { data: employer, isLoading: loadingEmployer, refetch: refetchEmployer } = useEmployerProfile();
  
  // Fetch wallet balance if employer wallet exists
  const { data: walletBalance } = useBalance({
    address: employer?.wallet as Address,
    enabled: !!employer?.wallet,
  });

  // Fetch multisig wallet data
  const {
    employeeCount,
    monthlyPayroll,
    transactionCount,
    employees,
  } = useMultisigWalletData(employer?.wallet as Address);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success(`${label} copied to clipboard`, {
      position: 'top-right',
      autoClose: 2000,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const stats = [
    { 
      label: 'Total Employees', 
      value: employeeCount.toString(), 
      icon: <Users className="w-5 h-5" />,
      color: 'emerald'
    },
    { 
      label: 'Wallet Balance', 
      value: walletBalance ? `${parseFloat(formatEther(walletBalance.value)).toFixed(4)} ${walletBalance.symbol}` : '0.00 LSK', 
      icon: <Wallet className="w-5 h-5" />,
      color: 'blue'
    },
    { 
      label: 'Monthly Payroll', 
      value: `$${parseFloat(monthlyPayroll || '0').toFixed(2)}`, 
      icon: <DollarSign className="w-5 h-5" />,
      color: 'purple'
    },
    { 
      label: 'Transactions', 
      value: transactionCount.toString(), 
      icon: <History className="w-5 h-5" />,
      color: 'orange'
    }
  ];


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
                {/* Welcome Section with Company Info */}
                {loadingEmployer ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : employer ? (
                  <div className="mb-8">
                    <div className={`rounded-2xl p-6 border mb-6 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-4 rounded-xl ${
                            theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'
                          }`}>
                            <Building2 className={`w-8 h-8 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          </div>
                          <div>
                            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {employer.companyName}
                            </h1>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                  {employer.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                                <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                                  {employer.location}
                                </span>
                              </div>
                              <div className={`mt-4 p-3 rounded-lg border ${
                                theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Wallet className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                  <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    Multisig Wallet Address
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {employer.wallet}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(employer.wallet, 'Wallet address')}
                                    className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                                      theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                  >
                                    {copiedAddress === employer.wallet ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                  <a
                                    href={`https://sepolia-blockscout.lisk.com/address/${employer.wallet}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                                      theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`text-right ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <div className="text-xs mb-1">Registered</div>
                          <div className="text-sm font-medium">
                            {employer.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

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
                        <div className={`p-3 rounded-lg ${
                          stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                          stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                          stat.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                          'bg-orange-500/10 text-orange-500'
                        }`}>
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

                {/* Employees Section */}
                <div className={`rounded-xl p-6 border mb-8 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Employees
                    </h2>
                    <button
                      onClick={() => router.push('/dashboard/employer/employees')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      Add Employee
                    </button>
                  </div>
                  {employees && employees.length > 0 ? (
                    <div className="space-y-3">
                      {employees.slice(0, 5).map((emp: any, index: number) => (
                        <div
                          key={emp.id}
                          className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                Employee #{emp.id}
                              </p>
                              <p className={`text-sm font-mono mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {emp.wallet}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Salary: ${formatUnits(emp.salary, 6)} USDC
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  emp.active
                                    ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                    : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {emp.active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {employees.length > 5 && (
                        <button
                          onClick={() => router.push('/dashboard/employer/employees')}
                          className={`w-full py-2 text-sm font-medium rounded-lg border ${
                            theme === 'dark'
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          View All {employees.length} Employees
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} />
                      <p className={`mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        No employees added yet
                      </p>
                      <button
                        onClick={() => router.push('/dashboard/employer/employees')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        Add Your First Employee
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className={`rounded-xl p-6 border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => router.push('/dashboard/employer/employees')}
                      className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Users className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <div className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Add Employees
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Register team members
                      </div>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/employer/funds')}
                      className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <DollarSign className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <div className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Add Funds
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Deposit to wallet
                      </div>
                    </button>
                    <button
                      onClick={() => router.push('/dashboard/employer/profile')}
                      className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <Building2 className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <div className={`font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        View Profile
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Company details
                      </div>
                    </button>
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

export default EmployerDashboard;
