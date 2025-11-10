'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, History, LayoutDashboard, UserCircle, Lock, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  role: 'employee' | 'student';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const employeeMenuItems = [
    { icon: Plus, label: 'กิจกรรม', href: '/emp/activity' },
    { icon: History, label: 'ประวัติการสร้าง', href: '/emp/history' },
  ];

  const studentMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student/dashboard' },
    { icon: History, label: 'ประวัติกิจกรรม', href: '/student/history' },
  ];

  const menuItems = role === 'employee' ? employeeMenuItems : studentMenuItems;

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-md border border-green-200"
      >
        {showMobileMenu ? (
          <X className="w-6 h-6 text-green-600" />
        ) : (
          <Menu className="w-6 h-6 text-green-600" />
        )}
      </button>

      {/* Overlay for mobile */}
      {showMobileMenu && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        showMobileMenu ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white flex flex-col transition-transform duration-300 shadow-lg`}>
        
        {/* Header */}
        <div className="p-6 border-b border-green-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ACTY</h1>
              <p className="text-xs text-green-600 font-medium">
                {role === 'employee' ? 'พนักงาน' : 'นักศึกษา'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive 
                    ? 'bg-green-500 text-white shadow-sm' 
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-green-100 space-y-2 bg-white">
          <Link
            href="/profile"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all font-medium border border-transparent hover:border-green-100"
          >
            <UserCircle className="w-5 h-5" />
            โปรไฟล์
          </Link>
          <Link
            href="/change-password"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all font-medium border border-transparent hover:border-green-100"
          >
            <Lock className="w-5 h-5" />
            เปลี่ยนรหัสผ่าน
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-all font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  );
}