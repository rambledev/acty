'use client';

import { useState } from 'react';
import { Search, QrCode, Eye } from 'lucide-react';

export default function EmployeeHistoryPage() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Mock data
  const activities = [
    { 
      id: 1, 
      name: 'โครงการอบรมจริยธรรม', 
      type: 'ส่วนกลาง', 
      hours: 3, 
      date: '2024-11-15', 
      participants: 45 
    },
    { 
      id: 2, 
      name: 'กิจกรรมวันคล้ายวันสถาปนา', 
      type: 'คณะ', 
      hours: 2, 
      date: '2024-11-10', 
      participants: 120 
    },
    { 
      id: 3, 
      name: 'อบรมภาษาอังกฤษ', 
      type: 'เสรี', 
      hours: 6, 
      date: '2024-11-05', 
      participants: 30 
    },
  ];

  const handleShowQR = (activity: any) => {
    setSelectedActivity(activity);
    setShowQRModal(true);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ประวัติการสร้างกิจกรรม</h2>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="ค้นหากิจกรรม..."
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">ชื่อกิจกรรม</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">ประเภท</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">ชั่วโมง</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">วันที่</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">ผู้เข้าร่วม</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm text-gray-800 font-medium">{activity.name}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      activity.type === 'ส่วนกลาง' ? 'bg-primary-100 text-primary-700' :
                      activity.type === 'คณะ' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{activity.hours} ชม.</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{activity.date}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{activity.participants} คน</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => handleShowQR(activity)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                        title="ออก QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      {showQRModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">QR Code กิจกรรม</h3>
            <div className="text-center mb-6">
              <p className="font-medium text-gray-700">{selectedActivity.name}</p>
              <p className="text-sm text-gray-600">รหัส: ACT{String(selectedActivity.id).padStart(3, '0')}</p>
              <p className="text-sm text-primary-600 mt-1 font-medium">{selectedActivity.hours} ชั่วโมง</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-2xl mb-6 flex items-center justify-center">
              <div className="w-64 h-64 bg-white rounded-xl flex items-center justify-center border-4 border-gray-200">
                <QrCode className="w-48 h-48 text-gray-800" />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30">
                ดาวน์โหลด
              </button>
              <button 
                onClick={() => setShowQRModal(false)}
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