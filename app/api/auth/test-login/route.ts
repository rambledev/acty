// app/api/auth/test-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

interface TestUserData {
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'STUDENT';
  title?: string;
  faculty?: string;
  department?: string;
  program?: string;
  stdCode?: string;
  empCode?: string;
}

const testUsers: Record<string, TestUserData> = {
  ADMIN: {
    email: 'admin@rmu.ac.th',
    name: 'ผู้ดูแลระบบ',
    role: 'ADMIN',
    title: 'นาย',
    faculty: 'สำนักงานอธิการบดี',
    department: 'ฝ่ายเทคโนโลยีสารสนเทศ'
  },
  EMPLOYEE: {
    email: 'employee@rmu.ac.th', 
    name: 'เจ้าหน้าที่ทดสอบ',
    role: 'EMPLOYEE',
    title: 'นาง',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    department: 'วิทยาการคอมพิวเตอร์',
    empCode: 'EMP001'
  },
  STUDENT: {
    email: 'student@rmu.ac.th',
    name: 'นักศึกษาทดสอบ',  
    role: 'STUDENT',
    title: 'นาง',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    program: 'วิทยาการคอมพิวเตอร์',
    stdCode: 'STD001'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();

    if (!role || !testUsers[role]) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    console.log(`Test login attempt for role: ${role}`);

    let user;
    const testUserData = testUsers[role];

    // หา user ในฐานข้อมูล
    user = await prisma.user.findUnique({
      where: { email: testUserData.email },
    });

    // ถ้าไม่มี user ให้สร้างใหม่
    if (!user) {
      console.log(`Creating new test user for role: ${role}`);
      user = await prisma.user.create({
        data: {
          email: testUserData.email,
          name: testUserData.name,
          role: testUserData.role,
          title: testUserData.title || null,
          faculty: testUserData.faculty || null,
          department: testUserData.department || null,
          program: testUserData.program || null,
          stdCode: testUserData.stdCode || null,
          empCode: testUserData.empCode || null,
        },
      });
    }

    // อัพเดท lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // สร้าง session data
    const sessionData = {
      user: {
        id: user.id,
        username: user.email.split('@')[0],
        fullName: user.title ? `${user.title}${user.name}` : user.name,
        title: user.title,
        name: user.name,
        faculty: user.faculty,
        program: user.program,
        department: user.department,
        email: user.email,
        hours: {
          central: user.centralHours,
          faculty: user.facultyHours,
          free: user.freeHours,
          total: user.centralHours + user.facultyHours + user.freeHours,
        },
        role: user.role,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 วัน
      createdAt: new Date(),
    };

    // สร้าง encrypted session
    const session = await encrypt(sessionData);

    // ตั้งค่า cookie
    const cookieStore = await cookies();
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 วัน
      path: '/',
    });

    console.log(`Test login successful for ${testUserData.name} (${role})`);

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        fullName: sessionData.user.fullName,
      },
    });

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}