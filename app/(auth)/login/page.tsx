'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Suspense } from 'react';

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect');

  const handleStudentLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'STUDENT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      router.push(redirectTo || '/student/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (role: 'ADMIN' | 'EMPLOYEE') => {
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      router.push(role === 'ADMIN' ? '/admin/dashboard' : '/emp/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fromScan = redirectTo?.startsWith('/scan/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-8 pt-10 pb-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image src="/100.png" alt="มรม." fill className="object-contain drop-shadow-lg" priority />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ACTY</h1>
            <p className="text-emerald-100 text-sm mt-1">ระบบสะสมชั่วโมงกิจกรรม</p>
            <p className="text-emerald-200 text-xs mt-0.5">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
          </div>

          <div className="px-8 py-8 space-y-4">

            {/* แจ้งเตือนถ้ามาจาก QR */}
            {fromScan && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                <span className="text-xl shrink-0">📱</span>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">สแกน QR Code แล้ว</p>
                  <p className="text-amber-600 text-xs mt-0.5">เข้าสู่ระบบเพื่อบันทึกชั่วโมงกิจกรรม</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* ── ปุ่มหลัก: นักศึกษา ── */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider text-center">นักศึกษา</p>
              <button
                onClick={handleStudentLogin}
                disabled={loading}
                className="w-full relative bg-white border-2 border-gray-200 hover:border-emerald-400 rounded-2xl px-4 py-4 flex items-center gap-4 transition-all hover:shadow-md active:scale-[.98] disabled:opacity-50 group"
              >
                {/* Google icon */}
                <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center shrink-0 border border-gray-100">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800 text-sm group-hover:text-emerald-700">
                    {fromScan ? '🎯 เข้าสู่ระบบเพื่อสแกน QR' : 'เข้าสู่ระบบด้วย Google'}
                  </p>
                  <p className="text-xs text-gray-400">@rmu.ac.th</p>
                </div>
                {loading && (
                  <svg className="animate-spin w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-300">บุคลากร</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* ── ปุ่ม staff (เล็กลง ด้านล่าง) ── */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStaffLogin('EMPLOYEE')}
                disabled={loading}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                เจ้าหน้าที่
              </button>
              <button
                onClick={() => handleStaffLogin('ADMIN')}
                disabled={loading}
                className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                ผู้ดูแลระบบ
              </button>
            </div>

            {/* หมายเหตุ demo */}
            <p className="text-center text-xs text-gray-300">
              Demo — Google OAuth จะเปิดใช้เมื่อโดเมนพร้อม
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}