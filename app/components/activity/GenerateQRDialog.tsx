// components/activity/GenerateQRDialog.tsx
'use client';

import { useState } from 'react';
import { X, QrCode, Check, Loader2 } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  group: 'CENTRAL' | 'FACULTY' | 'FREE';
  hours: number;
}

interface GenerateQRDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activity: Activity;
}

export default function GenerateQRDialog({
  open,
  onClose,
  onSuccess,
  activity,
}: GenerateQRDialogProps) {
  const [maxUses, setMaxUses] = useState<number>(50);
  const [expiredDate, setExpiredDate] = useState<string>('');
  const [expiredTime, setExpiredTime] = useState<string>('23:59');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getDefaultDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');

      const expiryDate = expiredDate || getDefaultDate();
      const expiredAt = new Date(`${expiryDate}T${expiredTime}:00`);

      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          maxUses,
          expiredAt: expiredAt.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'สร้าง QR Code ไม่สำเร็จ');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMaxUses(50);
    setExpiredDate('');
    setExpiredTime('23:59');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">สร้าง QR Code</h2>
              <p className="text-sm text-gray-500">{activity.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* จำนวนผู้ scan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จำนวนผู้ scan สูงสุด
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              QR Code นี้จะรองรับการ scan ได้สูงสุด {maxUses} คน
            </p>
          </div>

          {/* วันเวลาหมดอายุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันเวลาหมดอายุ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={expiredDate || getDefaultDate()}
                onChange={(e) => setExpiredDate(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="time"
                value={expiredTime}
                onChange={(e) => setExpiredTime(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* สรุป */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <h4 className="font-medium text-gray-700">สรุป</h4>
            <div className="flex justify-between">
              <span className="text-gray-500">กิจกรรม:</span>
              <span className="font-medium text-gray-900">{activity.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ชั่วโมง:</span>
              <span className="font-medium text-gray-900">{activity.hours} ชม.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">รองรับ:</span>
              <span className="font-medium text-gray-900">{maxUses} คน</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                สร้าง QR Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}