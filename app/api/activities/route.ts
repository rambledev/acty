// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeQRCodes = searchParams.get('includeQRCodes') === 'true';

    const activities = await prisma.activity.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true,
            faculty: true,
            department: true,
            stdCode: true,
            empCode: true,
          },
        },
        qrCodes: includeQRCodes ? {
          select: {
            id: true,
            code: true,
            isUsed: true,
            isActive: true,
            currentUses: true,
            maxUses: true,
            type: true,
            createdAt: true,
          }
        } : {
          select: {
            isUsed: true,
            isActive: true,
            currentUses: true,
            maxUses: true
          }
        },
        _count: {
          select: {
            activityHistories: true,
            qrCodes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedActivities = activities.map(activity => {
      // สร้างชื่อเต็มของผู้สร้าง
      const createdByName = activity.createdBy 
        ? `${activity.createdBy.title || ''}${activity.createdBy.name}`.trim()
        : null;

      // สร้างข้อมูลหน่วยงานของผู้สร้าง
      const createdByOrg = activity.createdBy 
        ? [activity.createdBy.faculty, activity.createdBy.department].filter(Boolean).join(' - ')
        : null;

      return {
        id: activity.id.toString(),
        name: activity.name,
        description: activity.description,
        group: activity.group,
        hours: activity.hours,
        startDate: activity.startDate,
        endDate: activity.endDate,
        location: activity.location,
        organizer: activity.organizer,
        status: activity.status,
        createdById: activity.createdById,
        createdBy: activity.createdBy ? {
          ...activity.createdBy,
          fullName: createdByName,
          organization: createdByOrg,
        } : null,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
        _count: {
          activityHistories: activity._count.activityHistories,
          qrCodes: activity._count.qrCodes
        },
        qrCodes: includeQRCodes ? activity.qrCodes : undefined,
        qrCodesUsed: activity.qrCodes.filter(qr => qr.isUsed).length,
        qrCodesUnused: activity.qrCodes.filter(qr => !qr.isUsed).length,
        qrCodesActive: activity.qrCodes.filter(qr => qr.isActive).length,
        qrCodesInactive: activity.qrCodes.filter(qr => !qr.isActive).length,
      };
    });

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลกิจกรรม' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ session ก่อน
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้างกิจกรรม' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      startDate, 
      endDate, 
      group, 
      hours, 
      location, 
      organizer,
      status = 'ACTIVE'
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'กรุณาระบุชื่อกิจกรรม' },
        { status: 400 }
      );
    }

    if (!group || !['CENTRAL', 'FACULTY', 'FREE'].includes(group)) {
      return NextResponse.json(
        { error: 'กรุณาระบุประเภทกิจกรรมที่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!hours || hours < 0.5) {
      return NextResponse.json(
        { error: 'กรุณาระบุจำนวนชั่วโมงที่ถูกต้อง (อย่างน้อย 0.5 ชั่วโมง)' },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        return NextResponse.json(
          { error: 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด' },
          { status: 400 }
        );
      }
    }

    console.log('Creating activity with session user:', {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role
    });

    const activity = await prisma.activity.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        group: group as 'CENTRAL' | 'FACULTY' | 'FREE',
        hours: parseInt(hours.toString()),
        location: location?.trim() || null,
        organizer: organizer?.trim() || null,
        status: status as 'ACTIVE' | 'INACTIVE' | 'CANCELLED',
        createdById: session.user.id, // ใช้ session.userId แทน session.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true,
            faculty: true,
            department: true,
            stdCode: true,
            empCode: true,
          },
        },
        _count: {
          select: {
            activityHistories: true,
            qrCodes: true,
          },
        },
      },
    });

    console.log('Activity created successfully:', {
      id: activity.id,
      name: activity.name,
      createdById: activity.createdById,
      createdBy: activity.createdBy
    });

    // สร้างชื่อเต็มของผู้สร้าง
    const createdByName = activity.createdBy 
      ? `${activity.createdBy.title || ''}${activity.createdBy.name}`.trim()
      : null;

    // Format response เหมือน GET
    const formattedActivity = {
      id: activity.id.toString(),
      name: activity.name,
      description: activity.description,
      group: activity.group,
      hours: activity.hours,
      startDate: activity.startDate,
      endDate: activity.endDate,
      location: activity.location,
      organizer: activity.organizer,
      status: activity.status,
      createdById: activity.createdById,
      createdBy: activity.createdBy ? {
        ...activity.createdBy,
        fullName: createdByName,
        organization: [activity.createdBy.faculty, activity.createdBy.department].filter(Boolean).join(' - '),
      } : null,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      _count: activity._count,
      qrCodesUsed: 0,
      qrCodesUnused: 0,
      qrCodesActive: 0,
      qrCodesInactive: 0,
    };

    return NextResponse.json(formattedActivity, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    // Handle Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'กิจกรรมนี้มีอยู่แล้วในระบบ' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างกิจกรรม' },
      { status: 500 }
    );
  }
}