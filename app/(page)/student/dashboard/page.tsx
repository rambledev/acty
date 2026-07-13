// app/student/dashboard/page.tsx (หรือ app/dashboard/page.tsx)
'use client';

import { QrCode, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { StudentDashboardData } from '@/lib/types';

const StatusBadge = ({ passed }: { passed: boolean }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
    passed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
  }`}>
    {passed ? <><CheckCircle className="w-4 h-4" /><span>ผ่าน</span></> : <><AlertCircle className="w-4 h-4" /><span>ยังไม่ผ่าน</span></>}
  </div>
);

// ── Welcome Toast ──────────────────────────────────────────────────────────────
function WelcomeToast({ name }: { name?: string }) {
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === '1') {
      setShow(true);
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
      <span className="text-2xl">👋</span>
      <div>
        <p className="font-bold text-sm">ยินดีต้อนรับกลับ!</p>
        {name && <p className="text-xs text-green-100">{name}</p>}
      </div>
    </div>
  );
}

function DashboardContent() {
  const [data,    setData]    = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const stdCode = '66010001';

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/students/${stdCode}/hours`);
        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching student data:', err);
        const mockData: StudentDashboardData = {
          student: { id: 1, stdCode: '66010001', name: 'สมชาย ใจดี', faculty: 'วิทยาศาสตร์', program: 'วิทยาการคอมพิวเตอร์' },
          hours:   { group1: 35, group2: 45, group3: 20, total: 100 },
          required: { group1: 90, group2: 90, group3: 50 },
          status:  { group1Passed: false, group2Passed: false, group3Passed: false, allPassed: false },
          recentActivities: [
            { id: 1, name: 'โครงการอบรมจริยธรรม',        group: 1, groupName: 'ส่วนกลาง', hours: 3, date: '2024-11-15', scannedAt: '2024-11-15T10:00:00Z' },
            { id: 2, name: 'กิจกรรมวันคล้ายวันสถาปนา',  group: 2, groupName: 'คณะ',      hours: 2, date: '2024-11-10', scannedAt: '2024-11-10T14:00:00Z' },
            { id: 3, name: 'กิจกรรมจิตอาสา',              group: 3, groupName: 'เสรี',     hours: 4, date: '2024-11-08', scannedAt: '2024-11-08T08:00:00Z' },
          ],
        };
        setData(mockData);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentData();
  }, [stdCode]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-xl text-gray-700">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-xl text-gray-700 mb-4">{error || 'เกิดข้อผิดพลาด'}</p>
        <button onClick={() => window.location.reload()} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  );

  const { hours, required, status, recentActivities, student } = data;
  const totalRequired = required.group1 + required.group2 + required.group3;
  const g1Pct = Math.min((hours.group1 / required.group1) * 100, 100);
  const g2Pct = Math.min((hours.group2 / required.group2) * 100, 100);
  const g3Pct = Math.min((hours.group3 / required.group3) * 100, 100);

  return (
    <>
      <WelcomeToast name={student.name} />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ดกิจกรรม</h1>
            <p className="text-gray-600 mt-2">{student.name} ({student.stdCode}) • {student.faculty}</p>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
          {status.allPassed && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg p-6 text-white text-center animate-pulse">
              <CheckCircle className="w-16 h-16 mx-auto mb-3" />
              <h2 className="text-3xl font-bold mb-2">🎉 ยินดีด้วย!</h2>
              <p className="text-lg">คุณผ่านเกณฑ์กิจกรรมทุกกลุ่มแล้ว</p>
            </div>
          )}

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-sm font-medium mb-2 opacity-90">ชั่วโมงสะสมทั้งหมด</h3>
            <p className="text-5xl font-bold mb-2">{hours.total}</p>
            <p className="text-sm opacity-90">จาก {totalRequired} ชั่วโมง</p>
            <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((hours.total / totalRequired) * 100, 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'กิจกรรมส่วนกลาง', color: 'blue',   hours: hours.group1, req: required.group1, pct: g1Pct, passed: status.group1Passed },
              { label: 'กิจกรรมคณะ',      color: 'purple', hours: hours.group2, req: required.group2, pct: g2Pct, passed: status.group2Passed },
              { label: 'กิจกรรมเสรี',     color: 'orange', hours: hours.group3, req: required.group3, pct: g3Pct, passed: status.group3Passed },
            ].map(({ label, color, hours: h, req, pct, passed }) => (
              <div key={label} className={`bg-white rounded-2xl shadow-md p-6 border-2 border-${color}-200 hover:shadow-lg transition-shadow`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold text-${color}-700`}>{label}</h3>
                  <StatusBadge passed={passed} />
                </div>
                <p className={`text-4xl font-bold text-${color}-600 mb-2`}>{h}</p>
                <p className="text-sm text-gray-600 mb-4">จาก {req} ชั่วโมง</p>
                <div className={`w-full bg-${color}-50 rounded-full h-3 overflow-hidden border border-${color}-200`}>
                  <div className={`bg-gradient-to-r from-${color}-400 to-${color}-500 h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm text-gray-600 mt-3 font-medium">
                  {passed ? '✅ ผ่านเกณฑ์แล้ว' : `ต้องสะสมอีก ${req - h} ชม.`}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-md transition-all border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{activity.date} • {activity.hours} ชั่วโมง</p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap ml-4 ${
                      activity.group === 1 ? 'bg-blue-500 text-white' :
                      activity.group === 2 ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white'
                    }`}>{activity.groupName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-8 text-white text-center border border-green-300">
            <div className="bg-white/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <QrCode className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-2">แสกน QR Code</h3>
            <p className="mb-6 text-green-50">แสกน QR Code เพื่อเพิ่มชั่วโมงกิจกรรม</p>
            <a href="/student/scan">
              <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-all shadow-lg text-lg hover:scale-105 transform">
                ไปยังหน้าแสกน QR Code
              </button>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-10 h-10 animate-spin text-green-600" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}