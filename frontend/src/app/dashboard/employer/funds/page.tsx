'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowLeft, ArrowUp } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { RoleGuard } from '../../../components/RoleGuard';
import EmployerSidebar from '../../../components/EmployerSidebar';
import { useRouter } from 'next/navigation';
import { useSetup } from '../../../contexts/SetupContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount } from 'wagmi';

const FundsPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { address } = useAccount();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateSetupProgress } = useSetup();

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    // TODO: Implement add funds logic
    setTimeout(() => {
      setLoading(false);
      setAmount('');
      updateSetupProgress('fundsCompleted', true);
      router.push('/dashboard/employer');
    }, 2000);
  };

  return (
    <RoleGuard allowedRole="employer">
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
                className="flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardContent className="p-6">
                    <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Current Balance
                    </div>
                    <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      $0.00
                    </div>
                  </CardContent>
                </Card>
                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardContent className="p-6">
                    <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Monthly Payroll
                    </div>
                    <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      $0.00
                    </div>
                  </CardContent>
                </Card>
                <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <CardContent className="p-6">
                    <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Available
                    </div>
                    <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      $0.00
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                        Add Funds
                      </CardTitle>
                      <CardDescription>
                        Deposit funds to cover monthly payroll. Fund once with enough for all employees.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="amount">Amount (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={theme === 'dark' ? 'bg-slate-800 border-slate-600' : ''}
                      />
                      <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        Recommended: Enough to cover 3-6 months of payroll
                      </p>
                    </div>
                    <Button
                      onClick={handleAddFunds}
                      disabled={!amount || parseFloat(amount) <= 0 || loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      {loading ? (
                        'Processing...'
                      ) : (
                        <>
                          <ArrowUp className="w-4 h-4 mr-2" />
                          Add Funds
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
};

export default FundsPage;

