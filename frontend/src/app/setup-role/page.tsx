'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, ArrowRight, CheckCircle2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRole } from '../contexts/RoleContext';
import { useAccount } from 'wagmi';
import { useIsEmployerRegistered, useIsEmployeeRegistered } from '../../hooks/usePayroll';
import RegisterOnContract from '../components/RegisterOnContract';

const SetupRoleContent = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setRole } = useRole();
  const { address, isConnected } = useAccount();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationRole, setRegistrationRole] = useState<'employer' | 'employee' | null>(null);

  // Check registration status if wallet is connected
  const { data: isEmployerRegistered, isLoading: checkingEmployer } = useIsEmployerRegistered();
  const { data: isEmployeeRegistered, isLoading: checkingEmployee } = useIsEmployeeRegistered();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'employer' || role === 'employee') {
      setSelectedRole(role);
    }
  }, [searchParams]);

  // Check if user is already registered in the opposite role
  useEffect(() => {
    if (isConnected && address) {
      if (selectedRole === 'employer' && isEmployeeRegistered) {
        alert('This address is already registered as an employee. Each address can only have one role.');
        router.push('/');
        return;
      }
      if (selectedRole === 'employee' && isEmployerRegistered) {
        alert('This address is already registered as an employer. Each address can only have one role.');
        router.push('/');
        return;
      }
    }
  }, [isConnected, address, selectedRole, isEmployerRegistered, isEmployeeRegistered, router]);

  const handleRoleSelect = (role: 'employer' | 'employee') => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedRole(role);
    setRole(role); // Save role to context

    // Check if already registered
    const isRegistered = role === 'employer' ? isEmployerRegistered : isEmployeeRegistered;
    const isLoading = role === 'employer' ? checkingEmployer : checkingEmployee;

    if (isLoading) {
      // Wait for check to complete
      return;
    }

    if (isRegistered) {
      // Already registered, go to dashboard
      if (role === 'employer') {
        router.push('/dashboard/employer/setup');
      } else {
        router.push('/dashboard/employee');
      }
    } else {
      // Not registered, show registration form
      setRegistrationRole(role);
      setShowRegistration(true);
    }
  };

  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    if (registrationRole === 'employer') {
      router.push('/dashboard/employer/setup');
    } else {
      router.push('/dashboard/employee');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  // Show registration form if needed
  if (showRegistration && registrationRole) {
    return (
      <RegisterOnContract
        role={registrationRole}
        onRegistrationComplete={handleRegistrationComplete}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
      <div className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto relative z-10"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Choose Your Role
            </h1>
            <p className={`text-xl max-w-2xl mx-auto ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Select whether you're an employer managing payroll or an employee receiving payments
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            {/* Employer Option */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('employer')}
              className={`cursor-pointer rounded-2xl p-8 border-2 transition-all relative overflow-hidden group ${
                selectedRole === 'employer'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                  : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${
                  selectedRole === 'employer'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  <Building2 className="w-10 h-10" />
                </div>
                
                <h3 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  I'm an Employer
                </h3>
                
                <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Manage company payroll, add employees, set up signers, and process monthly payments
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employer' ? 'text-emerald-400' : 'text-emerald-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Setup company profile
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employer' ? 'text-emerald-400' : 'text-emerald-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Manage signers
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employer' ? 'text-emerald-400' : 'text-emerald-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Add employees & funds
                    </span>
                  </div>
                </div>

                <div className={`flex items-center font-semibold ${
                  selectedRole === 'employer' ? 'text-emerald-400' : 'text-emerald-500'
                }`}>
                  Continue as Employer
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </motion.div>

            {/* Employee Option */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('employee')}
              className={`cursor-pointer rounded-2xl p-8 border-2 transition-all relative overflow-hidden group ${
                selectedRole === 'employee'
                  ? 'border-teal-500 bg-teal-500/10'
                  : theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:border-teal-500/50'
                  : 'bg-white border-slate-200 hover:border-teal-300 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${
                  selectedRole === 'employee'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-500/10 text-teal-500'
                }`}>
                  <User className="w-10 h-10" />
                </div>
                
                <h3 className={`text-2xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  I'm an Employee
                </h3>
                
                <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Access your wallet, view balance, withdraw salary, and track payment history
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employee' ? 'text-teal-400' : 'text-teal-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      View wallet balance
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employee' ? 'text-teal-400' : 'text-teal-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Withdraw funds
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-5 h-5 ${
                      selectedRole === 'employee' ? 'text-teal-400' : 'text-teal-500'
                    }`} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Transaction history
                    </span>
                  </div>
                </div>

                <div className={`flex items-center font-semibold ${
                  selectedRole === 'employee' ? 'text-teal-400' : 'text-teal-500'
                }`}>
                  Continue as Employee
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="text-center mt-12"
          >
            <button
              onClick={() => router.push('/')}
              className={`text-sm ${theme === 'dark' ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ← Back to home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

const SetupRolePage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <SetupRoleContent />
    </Suspense>
  );
};

export default SetupRolePage;

