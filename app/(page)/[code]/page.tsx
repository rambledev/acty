// app/scan/[code]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [message, setMessage] = useState('');
  const [activityInfo, setActivityInfo] = useState<any>(null);

  useEffect(() => {
    if (code) {
      handleScan();
    }
  }, [code]);

  const handleScan = async () => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.status === 401) {
        setStatus('login_required');
        setMessage('กรุณาเข้าสู่ระบบก่อน scan กิจกรรม');
        return;
      }

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'ไม่สามารถ scan ได้');
        return;
      }

      setStatus('success');
      setMessage(data.message || 'บันทึกกิจกรรมสำเร็จ!');
      setActivityInfo(data.activity);
    } catch (error) {
      setStatus('error');
      setMessage('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const statusConfig = {
    loading: {
      icon: <Loader2 className="w-16 h-16 text-green-500 animate-spin" />,
      title: 'กำลังบันทึก...',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
    },
    success: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: 'สำเร็จ!',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
    },
    error: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: 'ไม่สำเร็จ',
      bgColor: 'bg-red-50',
      textColor: 'text-red-800',
    },
    login_required: {
      icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
      title: 'กรุณาเข้าสู่ระบบ',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-800',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">{config.icon}</div>

        {/* Title */}
        <h1 className={`text-2xl font-bold ${config.textColor}`}>
          {config.title}
        </h1>

        {/* Message */}
        <p className="text-gray-600">{message}</p>

        {/* Activity Info (แสดงเมื่อ scan สำเร็จ) */}
        {status === 'success' && activityInfo && (
          <div className={`${config.bgColor} rounded-xl p-4 space-y-2 text-left`}>
            <div className="text-sm">
              <span className="text-gray-500">กิจกรรม:</span>
              <span className="ml-2 font-medium text-gray-900">{activityInfo.name}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">ชั่วโมง:</span>
              <span className="ml-2 font-medium text-gray-900">{activityInfo.hours} ชม.</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">ประเภท:</span>
              <span className="ml-2 font-medium text-gray-900">
                {activityInfo.group === 'CENTRAL' ? 'ส่วนกลาง' : activityInfo.group === 'FACULTY' ? 'คณะ' : 'เสรี'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {status === 'login_required' && (
            <button
              onClick={() => router.push(`/login?redirect=/scan/${code}`)}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              เข้าสู่ระบบ
            </button>
          )}

          {status === 'success' && (
            <button
              onClick={() => router.push('/std/dashboard')}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              ดู Dashboard
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={handleScan}
              className="w-full bg-gray-600 text-white py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">ระบบสะสมชั่วโมงกิจกรรม ACTY</p>
          <p className="text-xs text-gray-400">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
        </div>
      </div>
    </div>
  );
}