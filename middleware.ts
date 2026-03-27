import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

// Rate limiting store
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// ฟังก์ชันตรวจสอบ rate limit
function checkRateLimit(ip: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now();
  const requestInfo = requestCounts.get(ip);

  if (requestInfo) {
    if (now < requestInfo.resetAt) {
      if (requestInfo.count >= limit) {
        return false;
      }
      requestInfo.count++;
    } else {
      requestCounts.set(ip, { count: 1, resetAt: now + window });
    }
  } else {
    requestCounts.set(ip, { count: 1, resetAt: now + window });
  }

  return true;
}

// Cleanup เก่าข้อมูล
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetAt) {
      requestCounts.delete(key);
    }
  }
}, 60000);

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // ดึง IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

  // ===== 1. ตรวจสอบ Origin (CORS Protection) =====
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ];

  const requestOrigin = request.headers.get('origin');
  const host = request.headers.get('host');

  // สำหรับ API routes, ตรวจสอบว่า request มาจาก same origin
  if (pathname.startsWith('/api/')) {
    if (requestOrigin && !allowedOrigins.some(allowed => requestOrigin.includes(allowed))) {
      // อนุญาตเฉพาะ request ที่มา origin เดียวกัน หรือจาก server-side
      if (requestOrigin && !requestOrigin.includes(host || '')) {
        return NextResponse.json(
          { error: 'CORS: Origin not allowed' },
          { status: 403 }
        );
      }
    }
  }

  // ===== 2. Rate Limiting (100 requests ต่อนาที) =====
  if (!checkRateLimit(ip, 100, 60000)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      }
    );
  }

  // ===== 3. ตรวจสอบ Security Headers =====
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), interest-cohort=()'
  );

  // CSP Header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';"
  );

  // ===== 4. Session Validation สำหรับ Protected Routes =====
  const protectedPaths = {
    admin: ['/admin'],
    employee: ['/emp'],
    student: ['/std'],
  };

  // ตรวจสอบว่าเป็น protected path หรือไม่
  const isAdminPath = protectedPaths.admin.some(path => pathname.startsWith(path));
  const isEmployeePath = protectedPaths.employee.some(path => pathname.startsWith(path));
  const isStudentPath = protectedPaths.student.some(path => pathname.startsWith(path));
  const isProtectedPath = isAdminPath || isEmployeePath || isStudentPath;

  if (isProtectedPath) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const sessionData = await decrypt(sessionCookie.value);

    if (!sessionData) {
      // Session invalid, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // ตรวจสอบว่า session หมดอายุหรือไม่
    if (new Date(sessionData.expires) < new Date()) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // ตรวจสอบ role-based access
    const userRole = sessionData.user.role;
    
    if (isAdminPath && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (isEmployeePath && userRole !== 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (isStudentPath && userRole !== 'STUDENT') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // เพิ่ม user data ใน header สำหรับใช้ใน page
    response.headers.set('x-user-data', Buffer.from(JSON.stringify(sessionData.user)).toString('base64'));
  }

  // ===== 5. Redirect ไปที่ dashboard ตาม role ถ้ามี session แล้ว =====
  if (pathname === '/login' || pathname === '/') {
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      const sessionData = await decrypt(sessionCookie.value);
      if (sessionData && new Date(sessionData.expires) > new Date()) {
        // Redirect ตาม role
        const roleRedirects = {
          ADMIN: '/admin/dashboard',
          EMPLOYEE: '/emp/dashboard',
          STUDENT: '/student/dashboard',
        };
        const redirectPath = roleRedirects[sessionData.user.role as keyof typeof roleRedirects] || '/login';
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
  }

  // ===== 6. API Routes Protection =====
  const protectedApiPaths = ['/api/activities', '/api/qrcode', '/api/scan', '/api/users'];
  const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path));

  if (isProtectedApi) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionData = await decrypt(sessionCookie.value);

    if (!sessionData || new Date(sessionData.expires) < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }
  }

  return response;
}

// กำหนด paths ที่ต้องการให้ middleware ทำงาน
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};