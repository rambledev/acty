import Sidebar from '@/app/components/Sidebar';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="employee" />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}