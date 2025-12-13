'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  UserPlus,
  History,
  Settings,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEmployerProfile } from '../../hooks/usePayroll';

interface EmployerSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const EmployerSidebar: React.FC<EmployerSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { data: employer } = useEmployerProfile();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard/employer',
      icon: LayoutDashboard,
      current: pathname === '/dashboard/employer'
    },
    {
      name: 'Company Profile',
      href: '/dashboard/employer/profile',
      icon: Building2,
      current: pathname === '/dashboard/employer/profile'
    },
    {
      name: 'Manage Signers',
      href: '/dashboard/employer/signers',
      icon: Users,
      current: pathname === '/dashboard/employer/signers'
    },
    {
      name: 'Add Funds',
      href: '/dashboard/employer/funds',
      icon: DollarSign,
      current: pathname === '/dashboard/employer/funds'
    },
    {
      name: 'Add Employees',
      href: '/dashboard/employer/employees',
      icon: UserPlus,
      current: pathname === '/dashboard/employer/employees'
    },
    {
      name: 'Transaction History',
      href: '/dashboard/employer/transactions',
      icon: History,
      current: pathname === '/dashboard/employer/transactions'
    },
  ];

  const bottomNavigation = [
    {
      name: 'Settings',
      href: '/dashboard/employer/settings',
      icon: Settings,
      current: pathname === '/dashboard/employer/settings'
    }
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          theme === 'dark' ? 'bg-slate-900 border-r border-slate-700' : 'bg-white border-r border-slate-200'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className={`flex items-center justify-between p-6 border-b ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <Link href="/dashboard/employer" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Nosen
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Company Profile Section */}
          {employer && (
            <div className={`p-4 border-b ${
              theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-100'
                }`}>
                  <Building2 className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {employer.companyName}
                  </p>
                  <p className={`text-xs truncate ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {employer.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.current
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom navigation */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    item.current
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

export default EmployerSidebar;

