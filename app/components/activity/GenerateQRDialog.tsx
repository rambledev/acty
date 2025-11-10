// components/activity/GenerateQRDialog.tsx
'use client';

import { useState } from 'react';
import { X, QrCode, Download, Copy, Users, User } from 'lucide-react';

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

type QRCodeType = 'SINGLE_USE' | 'MULTI_USE' | 'LIMITED_USE';

const qrTypeOptions = [
  {
    value: 'SINGLE_USE' as QRCodeType,
    label: 'QR Code แบบ 1 ต่อ 1',
    description: '1 QR Code ใช้ได้กับนักศึกษา 1 คนเท่านั้น',
    icon: User,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    value: 'MULTI_USE' as QRCodeType,
    label: 'QR Code แบบใช้รวม',
    description: '1 QR Code ใช้ได้กับนักศึกษาหลายคน ไม่จำกัดจำนวน',
    icon: Users,
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    value: 'LIMITED_USE' as QRCodeType,
    label: 'QR Code แบบจำกัดจำนวน',
    description: '1 QR Code ใช้ได้กับนักศึกษาจำนวนจำกัด',
    icon: Users,
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  }
];

export default function GenerateQRDialog({
  open,
  onClose,
  onSuccess,
  activity
}: GenerateQRDialogProps) {
  const [selectedType, setSelectedType] = useState<QRCodeType>('SINGLE_USE');
  const [maxUses, setMaxUses] = useState<number>(50);
  const [expiredAt, setExpiredAt] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [generatedQRs, setGeneratedQRs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'generate' | 'result'>('select');

  // คำนวณวันหมดอายุเริ่มต้น (7 วันจากปัจจุบัน)
  const getDefaultExpiryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      const qrData = {
        activityId: activity.id,
        type: selectedType,
        maxUses: selectedType === 'MULTI_USE' ? 1000 : maxUses,
        expiredAt: expiredAt ? new Date(expiredAt) : null,
        quantity: selectedType === 'SINGLE_USE' ? quantity : 1
      };

      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR codes');
      }

      const result = await response.json();
      setGeneratedQRs(result.qrCodes);
      setStep('result');
      onSuccess();
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    const csvContent = generatedQRs.map(qr => 
      `${qr.code},${qr.url},${new Date(qr.expiredAt).toLocaleDateString('th-TH')}`
    ).join('\n');
    
    const blob = new Blob([`QR Code,URL,หมดอายุ\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-codes-${activity.name}-${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอก QR Code URL ไปยังคลิปบอร์ดแล้ว');
  };

  const handleClose = () => {
    setStep('select');
    setGeneratedQRs([]);
    setSelectedType('SINGLE_USE');
    setMaxUses(50);
    setQuantity(1);
    setExpiredAt(getDefaultExpiryDate());
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                สร้าง QR Code สำหรับกิจกรรม
              </h2>
              <p className="text-sm text-gray-600">{activity.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 'select' && (
            <>
              {/* เลือกประเภท QR Code */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  เลือกประเภท QR Code
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {qrTypeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div
                        key={option.value}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedType === option.value
                            ? `${option.color} border-current`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedType(option.value)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedType === option.value
                              ? 'bg-current border-current'
                              : 'border-gray-300'
                          }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* จำนวน QR Code (สำหรับ SINGLE_USE) */}
              {selectedType === 'SINGLE_USE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวน QR Code ที่ต้องการสร้าง
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    สร้าง QR Code สำหรับนักศึกษา {quantity} คน
                  </p>
                </div>
              )}

              {/* จำนวนการใช้งานสูงสุด (สำหรับ LIMITED_USE) */}
              {selectedType === 'LIMITED_USE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนการใช้งานสูงสุด
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    QR Code นี้จะใช้งานได้สูงสุด {maxUses} ครั้ง
                  </p>
                </div>
              )}

              {/* วันหมดอายุ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  วันที่หมดอายุ (ไม่บังคับ)
                </label>
                <input
                  type="date"
                  value={expiredAt || getDefaultExpiryDate()}
                  onChange={(e) => setExpiredAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  หากไม่กำหนด ระบบจะใช้ระยะเวลา 7 วัน
                </p>
              </div>
            </>
          )}

          {step === 'result' && generatedQRs.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <QrCode className="w-5 h-5" />
                  <span className="font-medium">
                    สร้าง QR Code สำเร็จแล้ว {generatedQRs.length} ตัว
                  </span>
                </div>
              </div>

              {/* QR Codes List */}
              <div className="max-h-64 overflow-y-auto">
                {generatedQRs.map((qr, index) => (
                  <div
                    key={qr.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-900">
                        {qr.code}
                      </div>
                      <div className="text-xs text-gray-500">
                        หมดอายุ: {new Date(qr.expiredAt).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard(qr.url)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="คัดลอก URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Download Button */}
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดทั้งหมด (CSV)
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  สร้างเพิ่ม
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'select' && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
        )}

        {step === 'result' && (
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              ปิด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}