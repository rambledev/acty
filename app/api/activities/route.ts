// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        qrCodes: true,
        activityHistories: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // แปลงข้อมูลให้ตรงกับ interface ที่หน้า page ต้องการ
    const formattedActivities = activities.map(activity => ({
      id: activity.id.toString(),
      name: activity.name,
      description: activity.description,
      group: activity.group,
      hours: activity.hours,
      startDate: activity.startDate,
      endDate: activity.endDate,
      location: activity.location,
      organizer: activity.organizer,
      status: 'ACTIVE' as const, // ตั้งค่าเริ่มต้น
      _count: {
        activityHistories: activity.activityHistories.length,
        qrCodes: activity.qrCodes.length
      },
      qrCodesUsed: activity.qrCodes.filter(qr => qr.isUsed).length,
      qrCodesUnused: activity.qrCodes.filter(qr => !qr.isUsed).length,
      createdBy: {
        firstName: 'System',
        lastName: 'Admin'
      }
    }));

    return NextResponse.json(formattedActivities);

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลกิจกรรม' },
      { status: 500 }
    );
  }
}