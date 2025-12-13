'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, Copy, CheckCircle2, ExternalLink, Shield, Info, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { RoleGuard } from '../../../components/RoleGuard';
import RegistrationGuard from '../../../components/RegistrationGuard';
import EmployerSidebar from '../../../components/EmployerSidebar';
import { useRouter } from 'next/navigation';
import { useEmployerProfile } from '../../../../hooks/usePayroll';
import { useMultisigSigners, useMultisigThreshold } from '../../../../hooks/useMultisigWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { Address } from 'viem';

const SignersPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Fetch employer data to get wallet address
  const { data: employer, isLoading: loadingEmployer } = useEmployerProfile();
  
  // Fetch signers and threshold from multisig wallet
  const { data: signers, isLoading: loadingSigners } = useMultisigSigners(employer?.wallet as Address);
  const { data: threshold, isLoading: loadingThreshold } = useMultisigThreshold(employer?.wallet as Address);

  const isLoading = loadingEmployer || loadingSigners || loadingThreshold;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    toast.success('Address copied to clipboard', {
      position: 'top-right',
      autoClose: 2000,
    });
    setTimeout(() => setCopiedAddress(null), 2000);
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

                <Card className={`mb-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                          <Users className={`w-6 h-6 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                            Authorized Signers
                          </CardTitle>
                          <CardDescription>
                            Manage signers for your multisig wallet
                          </CardDescription>
                        </div>
                      </div>
                      {threshold !== undefined && (
                        <div className={`px-4 py-2 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Shield className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              Threshold: {threshold} of {signers?.length || 0}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      </div>
                    ) : !signers || signers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                        <p className={`mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          No signers found
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {signers.map((address, index) => (
                          <motion.div
                            key={address}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                  {address}
                                </p>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Authorized Signer
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(address)}
                                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                  theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {copiedAddress === address ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <a
                                href={`https://sepolia-blockscout.lisk.com/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2 rounded hover:bg-slate-700 transition-colors ${
                                  theme === 'dark' ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* How to Add/Remove Signers Guide */}
                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                        <Info className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <div>
                        <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                          How to Add or Remove Signers
                        </CardTitle>
                        <CardDescription>
                          Step-by-step guide for managing multisig wallet signers
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
                              Signers can only be added or removed through multisig transactions. This requires {threshold} out of {signers?.length || 0} signers to approve the transaction.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Add Signer Steps */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          <CheckCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          Adding a New Signer
                        </h3>
                        <ol className="space-y-3 ml-7">
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              1
                            </span>
                            <span className="text-sm">
                              <strong>Submit Transaction:</strong> Any signer can submit a transaction calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>addSigner(newSignerAddress)</code> on the multisig wallet contract.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              2
                            </span>
                            <span className="text-sm">
                              <strong>Get Confirmations:</strong> At least {threshold} signers must confirm the transaction by calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>confirmTransaction(txId)</code>.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              3
                            </span>
                            <span className="text-sm">
                              <strong>Execute:</strong> Once {threshold} confirmations are reached, any signer can execute the transaction using <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>executeTransaction(txId)</code>.
                            </span>
                          </li>
                        </ol>
                      </div>

                      {/* Remove Signer Steps */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          <AlertCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                          Removing a Signer
                        </h3>
                        <ol className="space-y-3 ml-7">
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                            }`}>
                              1
                            </span>
                            <span className="text-sm">
                              <strong>Submit Transaction:</strong> Submit a transaction calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>removeSigner(signerAddress)</code>.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                            }`}>
                              2
                            </span>
                            <span className="text-sm">
                              <strong>Important:</strong> The remaining signers after removal must be at least equal to the threshold ({threshold}). You cannot remove a signer if it would make the total signers less than the threshold.
                            </span>
                          </li>
                          <li className={`flex items-start gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'
                            }`}>
                              3
                            </span>
                            <span className="text-sm">
                              <strong>Get Confirmations & Execute:</strong> Follow the same confirmation and execution process as adding a signer.
                            </span>
                          </li>
                        </ol>
                      </div>

                      {/* Update Threshold */}
                      <div>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          <Shield className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                          Updating Threshold
                        </h3>
                        <p className={`text-sm ml-7 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          To change the threshold (number of required signatures), submit a transaction calling <code className={`px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-700'}`}>updateThreshold(newThreshold)</code>. The new threshold must be between 1 and the total number of signers.
                        </p>
                      </div>

                      {/* Contract Functions Reference */}
                      <div className={`mt-6 p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} />
                          <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Contract Functions Reference
                          </h4>
                        </div>
                        <div className="space-y-2 text-sm font-mono">
                          <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                            <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}>submitTransaction</span>
                            <span className="text-slate-500">(to, value, data)</span>
                          </div>
                          <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                            <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}>confirmTransaction</span>
                            <span className="text-slate-500">(txId)</span>
                          </div>
                          <div className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                            <span className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}>executeTransaction</span>
                            <span className="text-slate-500">(txId)</span>
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

export default SignersPage;
