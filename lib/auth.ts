import { cookies } from 'next/headers';
import { decrypt, SessionData } from './session';

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null;
  }

  const sessionData = await decrypt(sessionCookie.value);

  if (!sessionData) {
    return null;
  }

  // ตรวจสอบว่า session หมดอายุหรือไม่
  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  return sessionData;
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}