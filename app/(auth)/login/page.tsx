'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log('Login:', { username, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ACTY</h1>
          <p className="text-gray-600">ระบบสะสมชั่วโมงกิจกรรม มรม.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผู้ใช้
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="กรอกรหัสผู้ใช้"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="กรอกรหัสผ่าน"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30"
          >
            เข้าสู่ระบบ
          </button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">ยังไม่มีบัญชี?</p>
            <div className="flex gap-2 justify-center">
              <Link 
                href="/register/employee"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                ลงทะเบียนพนักงาน
              </Link>
              <span className="text-gray-300">|</span>
              <Link 
                href="/register/student"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                ลงทะเบียนนักศึกษา
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}