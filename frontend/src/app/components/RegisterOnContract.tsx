'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useTheme } from '../contexts/ThemeContext';
import { useRegisterEmployer, useRegisterEmployee, useIsEmployerRegistered, useIsEmployeeRegistered } from '../../hooks/usePayroll';
import { useWaitForTransaction } from '../../hooks/usePayroll';
import { Building2, User, Loader2, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import type { RegisterEmployerParams, RegisterEmployeeParams } from '../../types/payroll';

interface RegisterOnContractProps {
  role: 'employer' | 'employee';
  onRegistrationComplete: () => void;
}

const RegisterOnContract: React.FC<RegisterOnContractProps> = ({ role, onRegistrationComplete }) => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  // Check registration status
  const { data: isEmployerRegistered, isLoading: checkingEmployer } = useIsEmployerRegistered();
  const { data: isEmployeeRegistered, isLoading: checkingEmployee } = useIsEmployeeRegistered();
  
  // Registration mutations
  const registerEmployer = useRegisterEmployer();
  const registerEmployee = useRegisterEmployee();
  
  // Wait for transaction
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isWaiting, isSuccess: txSuccess, isError: txError } = useWaitForTransaction(txHash);
  
  // Also check mutation states
  const isProcessing = registerEmployer.isPending || registerEmployee.isPending || isWaiting;
  
  // Form state for employer
  const [employerForm, setEmployerForm] = useState<RegisterEmployerParams>({
    companyName: '',
    email: '',
    location: '',
    signers: [],
    threshold: 1,
  });
  
  // Form state for employee
  const [employeeForm, setEmployeeForm] = useState<RegisterEmployeeParams>({
    name: '',
    email: '',
    location: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signerAddress, setSignerAddress] = useState('');

  // Check if already registered
  const isRegistered = role === 'employer' ? isEmployerRegistered : isEmployeeRegistered;
  const isLoading = role === 'employer' ? checkingEmployer : checkingEmployee;

  // If already registered, call onRegistrationComplete
  useEffect(() => {
    if (!isLoading && isRegistered) {
      onRegistrationComplete();
    }
  }, [isRegistered, isLoading, onRegistrationComplete]);

  // If transaction succeeds, call onRegistrationComplete
  useEffect(() => {
    if (txSuccess) {
      setTimeout(() => {
        onRegistrationComplete();
      }, 2000); // Wait 2 seconds for contract state to update
    }
  }, [txSuccess, onRegistrationComplete]);

  // Add signer to employer form
  const addSigner = () => {
    if (!signerAddress.trim()) {
      setErrors({ ...errors, signer: 'Please enter a valid address' });
      return;
    }
    
    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(signerAddress)) {
      setErrors({ ...errors, signer: 'Invalid Ethereum address' });
      return;
    }
    
    if (employerForm.signers.includes(signerAddress as `0x${string}`)) {
      setErrors({ ...errors, signer: 'Address already added' });
      return;
    }
    
    setEmployerForm({
      ...employerForm,
      signers: [...employerForm.signers, signerAddress as `0x${string}`],
    });
    setSignerAddress('');
    setErrors({ ...errors, signer: '' });
  };

  // Remove signer
  const removeSigner = (index: number) => {
    setEmployerForm({
      ...employerForm,
      signers: employerForm.signers.filter((_, i) => i !== index),
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (role === 'employer') {
      if (!employerForm.companyName.trim()) {
        newErrors.companyName = 'Company name is required';
      }
      if (!employerForm.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employerForm.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!employerForm.location.trim()) {
        newErrors.location = 'Location is required';
      }
      if (employerForm.signers.length === 0) {
        newErrors.signers = 'At least one signer is required';
      }
      if (employerForm.threshold < 1 || employerForm.threshold > employerForm.signers.length) {
        newErrors.threshold = `Threshold must be between 1 and ${employerForm.signers.length}`;
      }
    } else {
      if (!employeeForm.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!employeeForm.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeForm.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!employeeForm.location.trim()) {
        newErrors.location = 'Location is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      let hash: `0x${string}`;
      
      if (role === 'employer') {
        // Add current address as signer if not already included
        const signers = employerForm.signers.includes(address)
          ? employerForm.signers
          : [address, ...employerForm.signers];
        
        hash = await registerEmployer.mutateAsync({
          ...employerForm,
          signers,
        });
      } else {
        hash = await registerEmployee.mutateAsync(employeeForm);
      }
      
      setTxHash(hash);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Failed to register. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Wallet Not Connected
            </h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              Please connect your wallet to register on the platform
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (isRegistered) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Already Registered
            </h2>
            <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
              You are already registered as {role === 'employer' ? 'an employer' : 'an employee'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isProcessing = registerEmployer.isPending || registerEmployee.isPending || isWaiting;

  return (
    <div className={`min-h-screen py-12 px-4 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl p-8 border ${
          theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-lg'
        }`}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`p-4 rounded-xl ${
              role === 'employer' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-teal-500/10 text-teal-500'
            }`}>
              {role === 'employer' ? (
                <Building2 className="w-8 h-8" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Register as {role === 'employer' ? 'Employer' : 'Employee'}
              </h2>
              <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                Complete your registration on the blockchain
              </p>
            </div>
          </div>

          {/* Success Message */}
          {txSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Registration successful! Redirecting...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {txError && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Transaction failed. Please try again.</span>
              </div>
            </div>
          )}

          {/* Employer Form */}
          {role === 'employer' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={employerForm.companyName}
                  onChange={(e) => setEmployerForm({ ...employerForm, companyName: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.companyName ? 'border-red-500' : ''}`}
                  placeholder="Acme Corporation"
                  disabled={isProcessing}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={employerForm.email}
                  onChange={(e) => setEmployerForm({ ...employerForm, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="contact@company.com"
                  disabled={isProcessing}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Location *
                </label>
                <input
                  type="text"
                  value={employerForm.location}
                  onChange={(e) => setEmployerForm({ ...employerForm, location: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="San Francisco, CA, USA"
                  disabled={isProcessing}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>

              {/* Signers */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Authorized Signers *
                </label>
                <div className="space-y-2">
                  {employerForm.signers.map((signer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
                      <span className="font-mono text-sm text-slate-300">{signer}</span>
                      <button
                        onClick={() => removeSigner(index)}
                        className="text-red-500 hover:text-red-400"
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={signerAddress}
                      onChange={(e) => setSignerAddress(e.target.value)}
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-600 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      } ${errors.signer ? 'border-red-500' : ''}`}
                      placeholder="0x..."
                      disabled={isProcessing}
                      onKeyPress={(e) => e.key === 'Enter' && addSigner()}
                    />
                    <button
                      onClick={addSigner}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isProcessing}
                    >
                      Add
                    </button>
                  </div>
                  {errors.signer && (
                    <p className="mt-1 text-sm text-red-500">{errors.signer}</p>
                  )}
                  {errors.signers && (
                    <p className="mt-1 text-sm text-red-500">{errors.signers}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Your address ({address?.slice(0, 6)}...{address?.slice(-4)}) will be automatically added as a signer
                  </p>
                </div>
              </div>

              {/* Threshold */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Signatures Required (Threshold) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={employerForm.signers.length + 1}
                  value={employerForm.threshold}
                  onChange={(e) => setEmployerForm({ ...employerForm, threshold: parseInt(e.target.value) || 1 })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.threshold ? 'border-red-500' : ''}`}
                  disabled={isProcessing}
                />
                {errors.threshold && (
                  <p className="mt-1 text-sm text-red-500">{errors.threshold}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Number of signatures required to approve transactions (max: {employerForm.signers.length + 1})
                </p>
              </div>
            </div>
          )}

          {/* Employee Form */}
          {role === 'employee' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="John Doe"
                  disabled={isProcessing}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="john.doe@example.com"
                  disabled={isProcessing}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Location *
                </label>
                <input
                  type="text"
                  value={employeeForm.location}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, location: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  } ${errors.location ? 'border-red-500' : ''}`}
                  placeholder="New York, NY, USA"
                  disabled={isProcessing}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-500">{errors.location}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <button
              onClick={handleRegister}
              disabled={isProcessing}
              className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isProcessing
                  ? 'bg-slate-600 cursor-not-allowed'
                  : role === 'employer'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-teal-600 hover:bg-teal-700'
              } text-white`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isWaiting ? 'Waiting for confirmation...' : 'Processing...'}
                </>
              ) : (
                <>
                  Register on Blockchain
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterOnContract;

