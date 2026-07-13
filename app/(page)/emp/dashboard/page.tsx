// app/emp/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LogoutButton from '@/app/components/LogoutButton';
import WelcomeBanner from '@/app/components/WelcomeBanner';

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'EMPLOYEE') redirect('/login');

  const { user } = session;
  const params = await searchParams;
  const showWelcome = params.welcome === '1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {showWelcome && <WelcomeBanner name={`${user.title || ''} ${user.name}`} color="blue" />}

      <header className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-blue-800">Employee Dashboard</h1>
                <p className="text-xs text-blue-600">เจ้าหน้าที่</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
                สวัสดี, {user.title} {user.name}
              </h2>
              <p className="text-blue-600 font-medium">บทบาท: เจ้าหน้าที่ (Employee)</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>{user.faculty}</p>
                <p>{user.department}</p>
                <p>{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'กิจกรรมที่ดูแล',           value: '12',  sub: 'กิจกรรมทั้งหมด',    color: 'purple' },
            { label: 'กิจกรรมที่กำลังดำเนินการ', value: '5',   sub: 'กิจกรรม',           color: 'emerald' },
            { label: 'นักศึกษาที่เข้าร่วม',      value: '324', sub: 'คน',                color: 'amber' },
            { label: 'QR Code ที่ใช้งาน',         value: '18',  sub: 'QR Code',           color: 'rose' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`bg-white rounded-2xl shadow-lg p-6 border-2 border-${color}-100`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
              <p className="text-3xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-100">
          <h3 className="text-xl font-bold text-blue-800 mb-4">เมนูด่วน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'สร้างกิจกรรม',        sub: 'เพิ่มกิจกรรมใหม่', color: 'blue',    href: '/emp/create' },
              { label: 'จัดการ QR Code',       sub: 'สำหรับกิจกรรม',   color: 'purple',  href: '/emp/activity' },
              { label: 'รายงานการเข้าร่วม',   sub: 'ดูสถิติ',          color: 'emerald', href: '/emp/history' },
            ].map(({ label, sub, color, href }) => (
              <a key={label} href={href} className={`flex items-center gap-3 p-4 rounded-xl border-2 border-${color}-100 hover:border-${color}-300 hover:bg-${color}-50 transition-all group`}>
                <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}>
                  <svg className={`w-6 h-6 text-${color}-600`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">{label}</p>
                  <p className="text-sm text-gray-500">{sub}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}