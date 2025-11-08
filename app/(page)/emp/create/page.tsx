// app/employee/activities/create/page.tsx
'use client';

import { useState } from 'react';
import { QrCode, Loader2, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createActivity } from '@/app/actions/activity-actions';

const activityTypes = [
  { value: 'CENTRAL', label: 'ส่วนกลาง' },
  { value: 'FACULTY', label: 'คณะ' },
  { value: 'OPTIONAL', label: 'เสรี' }
];

const activityTypeLabels: { [key: string]: string } = {
  CENTRAL: 'ส่วนกลาง',
  FACULTY: 'คณะ',
  OPTIONAL: 'เสรี'
};

interface QRModalData {
  activityId: string;
  activityName: string;
  hours: number;
  qrCode: string;
  activityType: string;
}

export default function CreateActivityPage() {
  const router = useRouter();
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState<QRModalData | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await createActivity(formData);
      
      if (result.success && result.activity && result.qrCode) {
        setQrData({
          activityId: result.activity.id,
          activityName: result.activity.name,
          hours: result.activity.hours,
          qrCode: result.qrCode.code,
          activityType: result.activity.type
        });
        setShowQRModal(true);
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการสร้างกิจกรรม');
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างกิจกรรม');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrData) return;

    const svgElement = document.getElementById('qr-code-svg');
    
    if (svgElement && svgElement instanceof SVGElement) {
      const svg = svgElement;
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-activity-${qrData.activityId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    router.push('/employee/activities');
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'CENTRAL': return 'bg-blue-100 text-blue-800';
      case 'FACULTY': return 'bg-green-100 text-green-800';
      case 'OPTIONAL': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">สร้างกิจกรรมใหม่</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <p className="font-medium">เกิดข้อผิดพลาด</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อกิจกรรม *
            </label>
            <input 
              type="text" 
              name="name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="กรอกชื่อกิจกรรม"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทกิจกรรม *
              </label>
              <select 
                name="type"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                required
                disabled={isLoading}
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                placeholder="0"
                min="0"
                step="0.5"
                required
                disabled={isLoading}
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เวลา
              </label>
              <input 
                type="time" 
                name="time"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                disabled={isLoading}
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              placeholder="กรอกสถานที่จัดกิจกรรม"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รายละเอียด
            </label>
            <textarea 
              rows={4}
              name="description"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none outline-none"
              placeholder="กรอกรายละเอียดกิจกรรม"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังสร้างกิจกรรม...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  สร้างกิจกรรมและออก QR Code
                </>
              )}
            </button>
            <button 
              type="button"
              onClick={() => router.back()}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>

      {/* QR Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">QR Code กิจกรรม</h3>
            
            <div className="text-center mb-6">
              <p className="font-medium text-gray-700 text-lg">{qrData.activityName}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getActivityTypeColor(qrData.activityType)}`}>
                {activityTypeLabels[qrData.activityType]}
              </span>
              <p className="text-sm text-gray-600 mt-2">รหัสกิจกรรม: {qrData.activityId}</p>
              <p className="text-lg text-primary-600 mt-1 font-bold">{qrData.hours} ชั่วโมง</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-2xl mb-6 flex items-center justify-center">
              <div className="bg-white rounded-xl p-4 border-4 border-gray-200">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrData.qrCode}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded break-all">
                {qrData.qrCode}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadQR}
                className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                ดาวน์โหลด
              </button>
              <button 
                onClick={handleCloseQRModal}
                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                ปิด
              </button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              * QR Code นี้ใช้ได้เพียง 1 ครั้งต่อนักศึกษา 1 คน
            </p>
          </div>
        </div>
      )}
    </div>
  );
}