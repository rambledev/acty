// app/admin/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LogoutButton from '@/app/components/LogoutButton';
import WelcomeBanner from '@/app/components/WelcomeBanner';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/login');

  const { user } = session;
  const params = await searchParams;
  const showWelcome = params.welcome === '1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {showWelcome && <WelcomeBanner name={user.fullName || user.name} color="red" />}

      <header className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-red-800">Admin Dashboard</h1>
                <p className="text-xs text-red-600">ผู้ดูแลระบบ</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-red-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-red-800 mb-2">
                สวัสดี, {user.fullName}
              </h2>
              <p className="text-red-600 font-medium">บทบาท: ผู้ดูแลระบบ (Administrator)</p>
              <p className="text-gray-600 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[
            { label: 'จำนวนนักศึกษา',  value: '1,245', sub: 'คนทั้งหมด',    color: 'blue' },
            { label: 'กิจกรรมทั้งหมด', value: '87',     sub: 'กิจกรรม',      color: 'purple' },
            { label: 'เจ้าหน้าที่',     value: '42',     sub: 'คนทั้งหมด',    color: 'emerald' },
            { label: 'การสแกนวันนี้',   value: '328',    sub: 'ครั้ง',         color: 'amber' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`bg-white rounded-2xl shadow-lg p-6 border-2 border-${color}-100`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-4">{label}</h3>
              <p className="text-3xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-red-100">
          <h3 className="text-xl font-bold text-red-800 mb-4">เมนูจัดการ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'จัดการผู้ใช้',   sub: 'เพิ่ม แก้ไข ลบ', color: 'red',    href: '/admin/users' },
              { label: 'จัดการกิจกรรม', sub: 'สร้าง แก้ไข',    color: 'blue',   href: '/admin/activities' },
              { label: 'รายงาน',         sub: 'สถิติและข้อมูล', color: 'purple', href: '/admin/reports' },
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