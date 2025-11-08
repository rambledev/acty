'use client';

import { QrCode } from 'lucide-react';

export default function StudentDashboardPage() {
  const totalHours = 5;
  const requiredHours = 20;
  const centralHours = 3;
  const facultyHours = 2;
  const optionalHours = 0;
  const percentage = (totalHours / requiredHours) * 100;

  // Mock recent activities
  const recentActivities = [
    { 
      id: 1, 
      name: 'โครงการอบรมจริยธรรม', 
      type: 'ส่วนกลาง', 
      hours: 3, 
      date: '2024-11-15' 
    },
    { 
      id: 2, 
      name: 'กิจกรรมวันคล้ายวันสถาปนา', 
      type: 'คณะ', 
      hours: 2, 
      date: '2024-11-10' 
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Total Hours Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
          <h3 className="text-sm font-medium mb-2 opacity-90">ชั่วโมงสะสม</h3>
          <p className="text-5xl font-bold mb-2">{totalHours}</p>
          <p className="text-sm opacity-90">จาก {requiredHours} ชั่วโมง</p>
        </div>
        
        {/* Central Hours Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-200">
          <h3 className="text-sm font-medium mb-2 text-green-700">ส่วนกลาง</h3>
          <p className="text-5xl font-bold text-green-600 mb-2">{centralHours}</p>
          <p className="text-sm text-gray-600">ชั่วโมง</p>
        </div>
        
        {/* Faculty Hours Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-200">
          <h3 className="text-sm font-medium mb-2 text-green-700">คณะ</h3>
          <p className="text-5xl font-bold text-green-600 mb-2">{facultyHours}</p>
          <p className="text-sm text-gray-600">ชั่วโมง</p>
        </div>
      </div>
      
      {/* Progress Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">ความคืบหน้า</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">ชั่วโมงกิจกรรมทั้งหมด</span>
              <span className="text-base font-bold text-green-600">{totalHours}/{requiredHours} ชม.</span>
            </div>
            <div className="w-full bg-green-50 rounded-full h-4 overflow-hidden border border-green-200">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">
              {percentage >= 100 ? '🎉 ยินดีด้วย! คุณผ่านเกณฑ์แล้ว' : `ต้องสะสมอีก ${requiredHours - totalHours} ชั่วโมง`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Recent Activities */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-green-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all border border-green-200">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{activity.date} • {activity.hours} ชั่วโมง</p>
              </div>
              <span className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap ml-4 ${
                activity.type === 'ส่วนกลาง' ? 'bg-green-500 text-white' :
                activity.type === 'คณะ' ? 'bg-green-600 text-white' :
                'bg-green-400 text-white'
              }`}>
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* QR Scanner CTA */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white text-center border border-green-300">
        <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
          <QrCode className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-bold mb-2">แสกน QR Code</h3>
        <p className="mb-6 text-green-50">แสกน QR Code เพื่อเพิ่มชั่วโมงกิจกรรม</p>
        <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg text-lg">
          เปิดกล้องสแกน
        </button>
      </div>
    </div>
  );
}