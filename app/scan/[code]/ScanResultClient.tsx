// app/scan/[code]/ScanResultClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2, QrCode, Clock, User } from 'lucide-react';

interface Activity {
  id: number;
  name: string;
  group: string;
  hours: number;
  organizer?: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  activity?: Activity;
}

const groupLabels: Record<string, string> = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ',
  FREE:    'เสรี',
};

const groupColors: Record<string, string> = {
  CENTRAL: 'bg-blue-100 text-blue-800 border-blue-200',
  FACULTY: 'bg-purple-100 text-purple-800 border-purple-200',
  FREE:    'bg-orange-100 text-orange-800 border-orange-200',
};

interface Props {
  code: string;
  user: { id: number; name: string; role: string };
}

export default function ScanResultClient({ code, user }: Props) {
  const router = useRouter();
  const [result,  setResult]  = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // POST ทันทีที่หน้าโหลด
    (async () => {
      try {
        const res  = await fetch('/api/students/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: code }),
        });
        const data = await res.json();
        if (res.ok) {
          setResult({ success: true, message: data.message, activity: data.activity });
        } else {
          setResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' });
        }
      } catch {
        setResult({ success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <QrCode className="w-7 h-7" />
            <div>
              <h1 className="text-xl font-bold">ACTY</h1>
              <p className="text-green-100 text-xs">ระบบสะสมชั่วโมงกิจกรรม</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <User className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium truncate">{user.name}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Loading */}
          {loading && (
            <div className="text-center py-10">
              <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">กำลังบันทึกกิจกรรม...</p>
            </div>
          )}

          {/* Success */}
          {!loading && result?.success && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">สแกนสำเร็จ! 🎉</h2>
                <p className="text-gray-500 text-sm mt-1">{result.message}</p>
              </div>

              {result.activity && (
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800">{result.activity.name}</p>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border ${groupColors[result.activity.group]}`}>
                      {groupLabels[result.activity.group]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      ชั่วโมงที่ได้รับ
                    </div>
                    <span className="text-2xl font-bold text-green-600">+{result.activity.hours} ชม.</span>
                  </div>
                  {result.activity.organizer && (
                    <p className="text-xs text-gray-400">ผู้จัด: {result.activity.organizer}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => router.push('/std/dashboard')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all"
              >
                ดูชั่วโมงสะสม
              </button>
            </div>
          )}

          {/* Error */}
          {!loading && result && !result.success && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">ไม่สามารถบันทึกได้</h2>
                <p className="text-red-500 text-sm mt-1">{result.message}</p>
              </div>
              <button
                onClick={() => router.push('/std/dashboard')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all"
              >
                กลับหน้าหลัก
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}