// app/employee/activities/components/CreateActivityDialog.tsx
'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateActivityDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const activityTypes = [
  { value: 'CENTRAL', label: 'ส่วนกลาง' },
  { value: 'FACULTY', label: 'คณะ' },
  { value: 'OPTIONAL', label: 'เสรี' }
];

export default function CreateActivityDialog({ open, onClose, onSuccess }: CreateActivityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // สร้าง QR Code อัตโนมัติหลังจากสร้างกิจกรรมสำเร็จ
        const qrResponse = await fetch('/api/qr-codes/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            activityId: result.activity.id,
            quantity: 1,
          }),
        });

        const qrResult = await qrResponse.json();

        if (qrResult.success) {
          onSuccess();
        } else {
          setError('สร้างกิจกรรมสำเร็จ แต่ไม่สามารถสร้าง QR Code ได้');
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการสร้างกิจกรรม');
      console.error('Error creating activity:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">สร้างกิจกรรมใหม่</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อกิจกรรม *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="กรอกชื่อกิจกรรม"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทกิจกรรม *
              </label>
              <select
                name="type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">เลือกประเภท</option>
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนชั่วโมง *
              </label>
              <input
                type="number"
                name="hours"
                required
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่จัดกิจกรรม *
              </label>
              <input
                type="date"
                name="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลา
              </label>
              <input
                type="time"
                name="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานที่
            </label>
            <input
              type="text"
              name="location"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="กรอกสถานที่จัดกิจกรรม"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="กรอกรายละเอียดกิจกรรม"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}