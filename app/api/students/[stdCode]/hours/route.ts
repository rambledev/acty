// app/api/students/[stdCode]/hours/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// เกณฑ์การผ่าน
const REQUIRED_HOURS = {
  group1: 90,  // กิจกรรมส่วนกลาง
  group2: 90,  // กิจกรรมคณะ
  group3: 50,  // กิจกรรมเสรี
};

export async function GET(
  request: NextRequest,
  { params }: { params: { stdCode: string } }
) {
  try {
    const { stdCode } = params;

    // ดึงข้อมูลนักศึกษา
    const student = await prisma.student.findUnique({
      where: { stdCode },
      include: {
        histories: {
          include: {
            activity: true, // ดึงข้อมูลกิจกรรมมาด้วย
          },
          orderBy: {
            scannedAt: 'desc', // เรียงจากใหม่ไปเก่า
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนักศึกษา' },
        { status: 404 }
      );
    }

    // คำนวณชั่วโมงแยกตามกลุ่ม
    const hoursByGroup = {
      group1: 0,
      group2: 0,
      group3: 0,
    };

    const activities: any[] = [];

    student.histories.forEach((history) => {
      const activity = history.activity;
      const hours = activity.hours || 1; // ถ้าไม่มีกำหนดให้ 1 ชม.

      // รวมชั่วโมงตามกลุ่ม
      if (activity.group === 1) {
        hoursByGroup.group1 += hours;
      } else if (activity.group === 2) {
        hoursByGroup.group2 += hours;
      } else if (activity.group === 3) {
        hoursByGroup.group3 += hours;
      }

      // เก็บข้อมูลกิจกรรม
      activities.push({
        id: activity.id,
        name: activity.name,
        group: activity.group,
        groupName: 
          activity.group === 1 ? 'ส่วนกลาง' :
          activity.group === 2 ? 'คณะ' : 'เสรี',
        hours: hours,
        date: history.scannedAt.toISOString().split('T')[0],
        scannedAt: history.scannedAt.toISOString(),
      });
    });

    // คำนวณชั่วโมงรวม
    const totalHours = hoursByGroup.group1 + hoursByGroup.group2 + hoursByGroup.group3;

    // ตรวจสอบสถานะการผ่าน
    const isGroup1Passed = hoursByGroup.group1 >= REQUIRED_HOURS.group1;
    const isGroup2Passed = hoursByGroup.group2 >= REQUIRED_HOURS.group2;
    const isGroup3Passed = hoursByGroup.group3 >= REQUIRED_HOURS.group3;
    const isAllPassed = isGroup1Passed && isGroup2Passed && isGroup3Passed;

    return NextResponse.json({
      student: {
        id: student.id,
        stdCode: student.stdCode,
        name: student.name,
        faculty: student.faculty,
        program: student.program,
      },
      hours: {
        group1: hoursByGroup.group1,
        group2: hoursByGroup.group2,
        group3: hoursByGroup.group3,
        total: totalHours,
      },
      required: REQUIRED_HOURS,
      status: {
        group1Passed: isGroup1Passed,
        group2Passed: isGroup2Passed,
        group3Passed: isGroup3Passed,
        allPassed: isAllPassed,
      },
      recentActivities: activities.slice(0, 10), // แสดง 10 กิจกรรมล่าสุด
    });
  } catch (error) {
    console.error('Error fetching student hours:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// สำหรับ development: เพิ่ม endpoint POST เพื่อสร้างข้อมูลทดสอบ
export async function POST(
  request: NextRequest,
  { params }: { params: { stdCode: string } }
) {
  try {
    const { stdCode } = params;
    const body = await request.json();

    // ตัวอย่างการสร้างข้อมูลทดสอบ
    // body ควรมี: { activityId: number, hours: number, group: number }

    const student = await prisma.student.findUnique({
      where: { stdCode },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลนักศึกษา' },
        { status: 404 }
      );
    }

    // สร้าง QR Code และ History
    const qrCode = await prisma.qRCode.create({
      data: {
        code: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        activityId: body.activityId,
        usedBy: student.id,
        isUsed: true,
        usedAt: new Date(),
      },
    });

    const history = await prisma.activityHistory.create({
      data: {
        activityId: body.activityId,
        qrCodeId: qrCode.id,
        studentId: student.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกกิจกรรมสำเร็จ',
      history,
    });
  } catch (error) {
    console.error('Error creating activity history:', error);
    return NextResponse.json(
      { 
        error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}