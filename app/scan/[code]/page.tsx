// app/scan/[code]/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt } from '@/lib/session';
import ScanResultClient from './ScanResultClient';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ScanPage({ params }: Props) {
  const { code } = await params;

  // เช็ค session
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    // ยังไม่ login → ไป login พร้อม redirect กลับ
    redirect(`/login?redirect=/scan/${code}`);
  }

  const sessionData = await decrypt(sessionCookie.value);

  if (!sessionData || new Date(sessionData.expires) < new Date()) {
    redirect(`/login?redirect=/scan/${code}`);
  }

  if (sessionData.user.role !== 'STUDENT') {
    redirect('/login?error=student_only');
  }

  // login แล้ว → render client component ที่จะ POST scan ทันที
  return (
    <ScanResultClient
      code={code}
      user={sessionData.user}
    />
  );
}