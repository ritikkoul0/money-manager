'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Gamepad2,
  Ticket,
  Wallet,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const generalItems: NavItem[] = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/' },
    { name: 'Transactions', icon: <ArrowLeftRight size={20} />, href: '/transfers' },
    { name: 'Bills', icon: <CreditCard size={20} />, href: '/payments' },
    { name: 'Investments', icon: <Gamepad2 size={20} />, href: '/investments' },
    { name: 'Goals', icon: <Ticket size={20} />, href: '/goals' },
    { name: 'Salary', icon: <Wallet size={20} />, href: '/salary' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 bg-[#0f1419] border-r border-gray-800 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded"></div>
          </div>
          <span className="text-xl font-bold">MONEY</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        {/* General Section */}
        <div className="mb-8">
          <h3 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            General
          </h3>
          <ul className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-800/50 text-white border-l-2 border-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

      </nav>

      <div className="p-6 border-t border-gray-800">
        {/* User Profile */}
        {session?.user && (
          <div className="mb-4 p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session.user.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Log out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/30 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Log out</span>
        </button>
      </div>
      </aside>
    </>
  );
}

