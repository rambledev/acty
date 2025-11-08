'use client';

export default function StudentHistoryPage() {
  const activityTypes = ['ส่วนกลาง', 'คณะ', 'เสรี'];

  // Mock data
  const activities = [
    { 
      id: 1, 
      name: 'โครงการอบรมจริยธรรม', 
      type: 'ส่วนกลาง', 
      hours: 3, 
      date: '2024-11-15',
      status: 'เข้าร่วม'
    },
    { 
      id: 2, 
      name: 'กิจกรรมวันคล้ายวันสถาปนา', 
      type: 'คณะ', 
      hours: 2, 
      date: '2024-11-10',
      status: 'เข้าร่วม'
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ประวัติการเข้าร่วมกิจกรรม</h2>
          <select className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none">
            <option value="">ทุกประเภท</option>
            {activityTypes.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-gray-200 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-lg">{activity.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{activity.date}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  activity.type === 'ส่วนกลาง' ? 'bg-primary-100 text-primary-700' :
                  activity.type === 'คณะ' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {activity.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-primary-600 font-semibold">+ {activity.hours} ชั่วโมง</span>
                <span className="text-primary-600">✓ {activity.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}