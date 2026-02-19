import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this';
const encodedKey = new TextEncoder().encode(secretKey);

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'STUDENT';

export interface SessionData {
  user: {
    id: number;
    username: string;
    fullName: string;
    title?: string | null;
    name: string;
    faculty?: string | null;
    program?: string | null;
    department?: string | null;
    email?: string | null;
    hours?: {
      central: number;
      faculty: number;
      free: number;
      total: number;
    };
    role: UserRole;
  };
  expires: Date;
  createdAt: Date;
}

export async function encrypt(payload: SessionData): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}