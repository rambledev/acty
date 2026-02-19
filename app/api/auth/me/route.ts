// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }

    // ดึงข้อมูลผู้ใช้จาก users table พร้อมสถิติกิจกรรม
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        picture: true,
        title: true,
        faculty: true,
        program: true,
        department: true,
        stdCode: true,
        empCode: true,
        centralHours: true,
        facultyHours: true,
        freeHours: true,
        lastLoginAt: true,
        createdAt: true,
        // ไม่ใช้ updatedAt เพราะไม่มีในตาราง
        activities: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // เอาล่าสุด 5 รายการ
        },
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้' }, { status: 404 });
    }

    // สร้างชื่อเต็ม
    const fullName = user.title ? `${user.title}${user.name}` : user.name;
    
    // สร้างข้อมูลหน่วยงาน
    const organization = [user.faculty, user.department].filter(Boolean).join(' - ') || 'ไม่ระบุ';
    
    // สร้างข้อมูลประจำตัว
    const identifier = user.role === 'STUDENT' ? user.stdCode : 
                      user.role === 'EMPLOYEE' ? user.empCode : null;

    const userDetails = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      picture: user.picture,
      
      // ข้อมูลส่วนตัว
      title: user.title,
      fullName: fullName,
      faculty: user.faculty,
      program: user.program,
      department: user.department,
      organization: organization,
      
      // รหัสประจำตัว
      stdCode: user.stdCode,
      empCode: user.empCode,
      identifier: identifier,
      
      // สถิติชั่วโมงกิจกรรม
      centralHours: user.centralHours,
      facultyHours: user.facultyHours,
      freeHours: user.freeHours,
      totalHours: user.centralHours + user.facultyHours + user.freeHours,
      
      // สถิติกิจกรรม
      totalActivities: user.activities.length,
      recentActivities: user.activities,
      
      // ข้อมูลระบบ
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      user: userDetails,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' },
      { status: 500 }
    );
  }
}

// POST method สำหรับอัพเดทข้อมูลโปรไฟล์
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'ไม่ได้เข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'update_profile':
        // อัพเดทข้อมูลโปรไฟล์
        const allowedFields = ['title', 'faculty', 'program', 'department'];
        const updateData: any = {};
        
        // เฉพาะ field ที่อนุญาต
        for (const field of allowedFields) {
          if (data[field] !== undefined) {
            updateData[field] = data[field];
          }
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
          });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'อัพเดทข้อมูลโปรไฟล์สำเร็จ' 
        });
        
      case 'update_last_login':
        // อัพเดทเวลาล็อกอินล่าสุด
        await prisma.user.update({
          where: { id: session.user.id },
          data: { lastLoginAt: new Date() },
        });

        return NextResponse.json({ 
          success: true, 
          message: 'อัพเดทเวลาล็อกอินสำเร็จ' 
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล' },
      { status: 500 }
    );
  }
}