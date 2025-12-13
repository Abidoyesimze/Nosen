'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Mail, MapPin, Wallet, Calendar, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { RoleGuard } from '../../../components/RoleGuard';
import RegistrationGuard from '../../../components/RegistrationGuard';
import EmployerSidebar from '../../../components/EmployerSidebar';
import { useRouter } from 'next/navigation';
import { useEmployerProfile } from '../../../hooks/usePayroll';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';

const EmployerProfilePage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Fetch employer data from contract
  const { data: employer, isLoading } = useEmployerProfile();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`, {
      position: 'top-right',
      autoClose: 2000,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoading) {
    return (
      <RoleGuard allowedRole="employer">
        <RegistrationGuard role="employer">
          <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <EmployerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="md:ml-64 flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          </div>
        </RegistrationGuard>
      </RoleGuard>
    );
  }

  if (!employer) {
    return (
      <RoleGuard allowedRole="employer">
        <RegistrationGuard role="employer">
          <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <EmployerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="md:ml-64 flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  No Profile Found
                </h2>
                <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                  Please register your company first
                </p>
              </div>
            </div>
          </div>
        </RegistrationGuard>
      </RoleGuard>
    );
  }

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

            <main className="p-6 max-w-4xl">
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

                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        <Building2 className={`w-6 h-6 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          Company Profile
                        </CardTitle>
                        <CardDescription>
                          Your company information registered on the blockchain
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Company Name */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Company Name
                        </label>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          {employer.companyName}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email Address
                        </label>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          {employer.email}
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          <MapPin className="w-4 h-4 inline mr-2" />
                          Location
                        </label>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          {employer.location}
                        </div>
                      </div>

                      {/* Wallet Address */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Wallet className="w-4 h-4 inline mr-2" />
                          Multisig Wallet Address
                        </label>
                        <div className={`p-3 rounded-lg border flex items-center justify-between ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {employer.wallet}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(employer.wallet, 'Wallet address')}
                              className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {copiedField === 'Wallet address' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={`https://sepolia-blockscout.lisk.com/address/${employer.wallet}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          This is your company's multisig wallet for payroll management
                        </p>
                      </div>

                      {/* Owner Address */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Owner Address
                        </label>
                        <div className={`p-3 rounded-lg border flex items-center justify-between ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <span className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {employer.owner}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(employer.owner, 'Owner address')}
                              className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              {copiedField === 'Owner address' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                            <a
                              href={`https://sepolia-blockscout.lisk.com/address/${employer.owner}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Registration Date */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Registration Date
                        </label>
                        <div className={`p-3 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          {employer.createdAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })} at {employer.createdAt.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Info Note */}
                      <div className={`p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <p className={`text-sm ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                          <strong>Note:</strong> This information is stored on the blockchain and cannot be modified. 
                          If you need to update your company details, you would need to register a new account.
                        </p>
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

export default EmployerProfilePage;
