'use client'
import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  Building2, 
  User, 
  Users, 
  ArrowRight, 
  CheckCircle2,
  DollarSign,
  Wallet,
  CreditCard,
  Shield,
  Clock,
  Settings,
  FileText,
  TrendingUp,
  Globe,
  Zap,
  PlayCircle,
  Sparkles,
  PlusCircle,
  History
} from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useIsEmployerRegistered, useIsEmployeeRegistered } from '../hooks/usePayroll';

const NosenLanding = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: isEmployerRegistered, isLoading: checkingEmployer } = useIsEmployerRegistered();
  const { data: isEmployeeRegistered, isLoading: checkingEmployee } = useIsEmployeeRegistered();
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
  const heroControls = useAnimation();

  // Redirect registered users to their dashboard
  useEffect(() => {
    if (isConnected && address && !checkingEmployer && !checkingEmployee) {
      if (isEmployerRegistered) {
        router.push('/dashboard/employer');
      } else if (isEmployeeRegistered) {
        router.push('/dashboard/employee');
      }
    }
  }, [isConnected, address, isEmployerRegistered, isEmployeeRegistered, checkingEmployer, checkingEmployee, router]);

  useEffect(() => {
    if (heroInView) {
      heroControls.start('visible');
    }
  }, [heroInView, heroControls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  const employerFeatures = [
    {
      title: "Setup Company Profile",
      description: "Add your company name, email, country, and essential business information",
      icon: <Building2 className="w-6 h-6" />,
      color: "emerald"
    },
    {
      title: "Manage Signers",
      description: "Add or remove authorized signers for payroll approvals and fund management",
      icon: <Users className="w-6 h-6" />,
      color: "emerald"
    },
    {
      title: "Fund Your Account",
      description: "Deposit funds once - enough to cover monthly salaries. The system handles the rest automatically",
      icon: <PlusCircle className="w-6 h-6" />,
      color: "emerald"
    },
    {
      title: "Add Employees",
      description: "Register team members and set their monthly salaries. Payments process automatically every month",
      icon: <User className="w-6 h-6" />,
      color: "emerald"
    },
    {
      title: "Automated Payments",
      description: "Once set up, monthly salaries are paid automatically to all registered employees. No manual work needed",
      icon: <Zap className="w-6 h-6" />,
      color: "emerald"
    },
    {
      title: "Transaction History",
      description: "Track all automated payroll transactions, payments, and fund movements in real-time",
      icon: <History className="w-6 h-6" />,
      color: "emerald"
    }
  ];

  const employeeFeatures = [
    {
      title: "Wallet Balance",
      description: "View your current balance and track monthly salary deposits in real-time",
      icon: <Wallet className="w-6 h-6" />,
      color: "teal"
    },
    {
      title: "Withdraw Funds",
      description: "Withdraw your salary to your preferred payment method instantly and securely",
      icon: <CreditCard className="w-6 h-6" />,
      color: "teal"
    },
    {
      title: "Transaction History",
      description: "Access complete history of all salary payments and withdrawals",
      icon: <FileText className="w-6 h-6" />,
      color: "teal"
    }
  ];

  const keyBenefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fully Automated",
      description: "Set up once - monthly payments process automatically. No manual intervention needed"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Transparent",
      description: "All transactions are recorded on-chain with full transparency"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description: "Pay employees worldwide regardless of their location"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Low Fees",
      description: "Significantly lower transaction costs compared to traditional banking"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "24/7 Access",
      description: "Manage payroll and access funds anytime, anywhere"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Role-Based Access",
      description: "Employers and employees have separate, secure dashboards"
    }
  ];

  const stats = [
    { number: "100%", label: "Secure", subtext: "Blockchain-powered" },
    { number: "< 2 min", label: "Fast", subtext: "Payment processing" },
    { number: "24/7", label: "Available", subtext: "Always accessible" },
    { number: "Global", label: "Reach", subtext: "Worldwide payments" }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={heroControls}
          className="max-w-7xl mx-auto relative z-10"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' 
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Modern Payroll Platform
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className={`text-5xl md:text-7xl font-bold mb-6 leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}
            >
              Payroll Made{' '}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent animate-gradient">
                Simple
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Secure & Fast
              </span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Automated monthly payroll powered by blockchain. Employers fund once, add employees, 
              and payments are processed automatically every month. No manual intervention needed.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              {isConnected && (isEmployerRegistered || isEmployeeRegistered) ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (isEmployerRegistered) {
                      router.push('/dashboard/employer');
                    } else if (isEmployeeRegistered) {
                      router.push('/dashboard/employee');
                    }
                  }}
                  className="px-8 py-4 rounded-xl font-semibold text-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/50 flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/setup-role')}
                  className="px-8 py-4 rounded-xl font-semibold text-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/50 flex items-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
                    : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                Watch Demo
                <PlayCircle className="w-5 h-5 inline ml-2" />
              </motion.button>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`rounded-2xl p-6 backdrop-blur-sm border ${
                    theme === 'dark'
                      ? 'bg-slate-900/50 border-slate-700'
                      : 'bg-white/80 border-slate-200 shadow-lg'
                  }`}
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className={`font-semibold text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {stat.label}
                  </div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {stat.subtext}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works - Automated Flow */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <Zap className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              How Automated Payroll Works
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Set it up once, and payments happen automatically every month. No manual processing needed.
            </p>
          </motion.div>

          {/* Flow Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {[
              {
                step: "1",
                title: "Fund Your Account",
                description: "Deposit funds to cover monthly salaries. Fund once with enough for all employees.",
                icon: <DollarSign className="w-8 h-8" />,
                color: "emerald"
              },
              {
                step: "2",
                title: "Add Employees",
                description: "Register your team members and set their monthly salary amounts.",
                icon: <User className="w-8 h-8" />,
                color: "emerald"
              },
              {
                step: "3",
                title: "Automated Payments",
                description: "The system automatically processes monthly payments to all registered employees.",
                icon: <Zap className="w-8 h-8" />,
                color: "emerald"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative rounded-2xl p-8 border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg">
                  {step.step}
                </div>
                <div className="text-emerald-500 mb-4 mt-4">{step.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {step.title}
                </h3>
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {step.description}
                </p>
                {index < 2 && (
                  <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 hidden md:block">
                    <ArrowRight className={`w-8 h-8 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-300'}`} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Key Point */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`max-w-3xl mx-auto rounded-2xl p-8 border ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-500/30'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Fully Automated Monthly Payments
                </h3>
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Once you've funded your account and added employees, the system takes over. 
                  Every month, salaries are automatically processed and sent to all registered employees. 
                  No need to manually initiate payments - it's completely hands-off after setup.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Role Selection Preview */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Choose Your Role
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Get started by selecting whether you're an employer or employee
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Employer Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => router.push('/setup-role?role=employer')}
              className={`cursor-pointer rounded-2xl p-8 border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                  : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="text-emerald-500 mb-4">
                <Building2 className="w-12 h-12" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                I'm an Employer
              </h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Fund your account once, add employees, and let automated monthly payments handle the rest
              </p>
              <div className="flex items-center text-emerald-500 font-semibold">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </motion.div>

            {/* Employee Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => router.push('/setup-role?role=employee')}
              className={`cursor-pointer rounded-2xl p-8 border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 hover:border-teal-500/50'
                  : 'bg-white border-slate-200 hover:border-teal-300 shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="text-teal-500 mb-4">
                <User className="w-12 h-12" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                I'm an Employee
              </h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Access your wallet, view balance, and withdraw your monthly salary payments
              </p>
              <div className="flex items-center text-teal-500 font-semibold">
                Get Started <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Employer Features */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
              <Building2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              For Employers
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Fund once, add employees, and enjoy fully automated monthly payroll processing
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employerFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`rounded-2xl p-8 border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 hover:border-emerald-500/50'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="text-emerald-500 mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {feature.title}
                </h3>
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Employee Features */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/10 mb-4">
              <User className="w-8 h-8 text-teal-500" />
            </div>
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              For Employees
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Simple, secure access to your salary and payment history
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {employeeFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`rounded-2xl p-8 border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 hover:border-teal-500/50'
                    : 'bg-white border-slate-200 hover:border-teal-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="text-teal-500 mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {feature.title}
                </h3>
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Why Choose Nosen
            </h2>
            <p className={`text-xl max-w-3xl mx-auto ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Built for modern businesses and employees who need fast, secure, and transparent payroll
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keyBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`rounded-2xl p-8 border transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 hover:border-emerald-500/50'
                    : 'bg-white border-slate-200 hover:border-emerald-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className="text-emerald-500 mb-4">{benefit.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {benefit.title}
                </h3>
                <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-emerald-900/20 via-slate-900 to-teal-900/20' 
          : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <h2 className={`text-4xl md:text-5xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Ready to Transform Your Payroll?
          </h2>
          <p className={`text-xl mb-8 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            Join forward-thinking companies using blockchain technology for secure, transparent payroll
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected && (isEmployerRegistered || isEmployeeRegistered) ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isEmployerRegistered) {
                    router.push('/dashboard/employer');
                  } else if (isEmployeeRegistered) {
                    router.push('/dashboard/employee');
                  }
                }}
                className="px-8 py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/50"
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/setup-role')}
                className="px-8 py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/50"
              >
                Get Started Free
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 rounded-xl font-bold text-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10'
                  : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              Schedule Demo
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={`py-16 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-900'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="text-2xl font-bold text-white">nosen</span>
              </div>
              <p className="text-slate-400 mb-4">
                Modern payroll platform powered by blockchain technology. Secure, fast, and transparent.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>For Employers</div>
                <div>For Employees</div>
                <div>Pricing</div>
                <div>Documentation</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Features</h3>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>Payroll Management</div>
                <div>Employee Onboarding</div>
                <div>Transaction History</div>
                <div>Secure Payments</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <div className="space-y-2 text-slate-400 text-sm">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400">&copy; 2025 Nosen. All rights reserved.</p>
            <div className="mt-4 md:mt-0 text-slate-400 text-sm">
              Built for Modern Payroll
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NosenLanding;
