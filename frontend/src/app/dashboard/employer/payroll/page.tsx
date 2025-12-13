'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowLeft, Clock, ToggleLeft, ToggleRight, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { RoleGuard } from '../../../components/RoleGuard';
import RegistrationGuard from '../../../components/RegistrationGuard';
import EmployerSidebar from '../../../components/EmployerSidebar';
import { useRouter } from 'next/navigation';
import { useEmployerProfile } from '../../../../hooks/usePayroll';
import { useMultisigPayrollConfig } from '../../../../hooks/useMultisigWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Address } from 'viem';

const PayrollConfigPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Fetch employer data to get wallet address
  const { data: employer, isLoading: loadingEmployer } = useEmployerProfile();
  
  // Fetch payroll config from multisig wallet
  const { data: payrollConfig, isLoading: loadingConfig } = useMultisigPayrollConfig(employer?.wallet as Address);

  const isLoading = loadingEmployer || loadingConfig;

  // Payroll frequency options
  const frequencyOptions = [
    { value: 0, label: 'Weekly', description: 'Payroll runs every 7 days' },
    { value: 1, label: 'Monthly', description: 'Payroll runs every 30 days' },
    { value: 2, label: 'Yearly', description: 'Payroll runs every 365 days' },
  ];

  // Format next execution date
  const formatNextExecution = (timestamp?: bigint) => {
    if (!timestamp) return 'Not set';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get frequency label
  const getFrequencyLabel = (frequency?: number) => {
    if (frequency === undefined) return 'Not configured';
    return frequencyOptions.find(opt => opt.value === frequency)?.label || 'Unknown';
  };

  return (
    <RoleGuard allowedRole="employer">
      <RegistrationGuard role="employer">
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <EmployerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          
          <div className="md:ml-64">
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
              </div>
            </div>

            <main className="p-6 max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => router.back()}
                  className={`flex items-center gap-2 mb-6 ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {/* Current Configuration */}
                <Card className={`mb-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        <Calendar className={`w-6 h-6 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          Automated Payroll Configuration
                        </CardTitle>
                        <CardDescription>
                          View and manage your automated payroll settings
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Status */}
                        <div className={`p-4 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              {payrollConfig && payrollConfig[2] ? (
                                <CheckCircle2 className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                              ) : (
                                <AlertCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                              )}
                              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                Automated Payroll Status
                              </span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              payrollConfig && payrollConfig[2]
                                ? theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                                : theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {payrollConfig && payrollConfig[2] ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                        </div>

                        {/* Current Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                Frequency
                              </span>
                            </div>
                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {getFrequencyLabel(payrollConfig ? Number(payrollConfig[0]) : undefined)}
                            </p>
                            {payrollConfig && (
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                {frequencyOptions.find(opt => opt.value === Number(payrollConfig[0]))?.description}
                              </p>
                            )}
                          </div>

                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                Next Execution
                              </span>
                            </div>
                            <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {formatNextExecution(payrollConfig ? payrollConfig[1] : undefined)}
                            </p>
                            {payrollConfig && payrollConfig[1] && Number(payrollConfig[1]) * 1000 < Date.now() && (
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                                Past due - payroll can be executed
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* How to Configure Guide */}
                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Info className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          How to Configure Automated Payroll
                        </CardTitle>
                        <CardDescription>
                          Step-by-step guide for setting up automated payroll
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Overview */}
                      <div className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <Info className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                          <div>
                            <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                              Important Note
                            </p>
                            <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                              Payroll configuration can only be set through multisig transactions. This requires approval from {employer ? 'your signers' : 'authorized signers'}.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Configuration Steps */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          Setting Up Automated Payroll
                        </h3>
                        <ol className="space-y-3 ml-7">
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              1
                            </span>
                            <span className="text-sm">
                              <strong>Choose Frequency:</strong> Select Weekly (7 days), Monthly (30 days), or Yearly (365 days) based on your payroll needs.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              2
                            </span>
                            <span className="text-sm">
                              <strong>Set First Execution Date:</strong> Choose when the first automated payroll should run. This must be a future timestamp.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              3
                            </span>
                            <span className="text-sm">
                              <strong>Submit Transaction:</strong> Any signer can submit a transaction calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>setPayrollConfig(frequency, firstExecutionTimestamp, active)</code> on the multisig wallet contract.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              4
                            </span>
                            <span className="text-sm">
                              <strong>Get Confirmations:</strong> Required signers must confirm the transaction by calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>confirmTransaction(txId)</code>.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              5
                            </span>
                            <span className="text-sm">
                              <strong>Execute:</strong> Once enough confirmations are reached, any signer can execute the transaction using <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>executeTransaction(txId)</code>.
                            </span>
                          </li>
                        </ol>
                      </div>

                      {/* Frequency Options */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          Payroll Frequency Options
                        </h3>
                        <div className="space-y-3">
                          {frequencyOptions.map((option) => (
                            <div
                              key={option.value}
                              className={`p-4 rounded-lg border ${
                                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {option.label}
                                  </p>
                                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {option.description}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  Value: {option.value}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Important Notes */}
                      <div className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-start gap-3">
                          <AlertCircle className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                          <div>
                            <p className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-900'}`}>
                              Important Notes
                            </p>
                            <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-orange-200' : 'text-orange-700'}`}>
                              <li>• Only employees with matching frequency will be paid during automated payroll execution</li>
                              <li>• Ensure your wallet has sufficient USDC balance before the execution date</li>
                              <li>• The payroll will automatically schedule the next execution based on the frequency</li>
                              <li>• You can disable automated payroll by setting <code className="px-1 py-0.5 rounded bg-orange-200/50">active = false</code></li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </main>
          </div>
        </div>
      </RegistrationGuard>
    </RoleGuard>
  );
};

export default PayrollConfigPage;

